import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { sendTelegramMessage } from "./bot";
import { insertPlayerSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  // 1. Проверка статуса игрока (подключен ли телеграм)
  app.get("/api/player/:id", async (req, res) => {
    const player = await storage.getPlayer(req.params.id);
    // res.json({ isConnected: player?.isConnected || false });
    res.json({
      isConnected: player?.isConnected || false,
      // lastPromoCode нам на фронте для блокировки больше не нужен,
      // но оставим, вдруг пригодится для отладки
      lastPromoCode: player?.lastPromoCode || null,
    });
  });

  // 2. Сохранение выигрыша / кода
  app.post("/api/game/win", async (req, res) => {
    const { storageId, promoCode: candidateCode } = req.body;

    const player = await storage.getPlayer(storageId);
    let finalCode = candidateCode;
    let message = "";

    if (player?.lastPromoCode) {
      // У игрока уже есть код. Используем старый.
      finalCode = player.lastPromoCode;
      message = `✨ *Снова победа!* Вы великолепны!\n\nНапоминаем, ваш эксклюзивный код всё еще ждет вас: \`${finalCode}\``;
    } else {
      // Первый выигрыш. Сохраняем новый.
      await storage.createOrUpdatePlayer({
        storageId,
        lastPromoCode: finalCode,
      });
      message = `🎉 *Победа!* Поздравляем!\n\nВаш эксклюзивный промокод: \`${finalCode}\``;
    }

    await sendTelegramMessage(storageId, message);

    // Возвращаем код обратно на фронт, чтобы показать именно ЕГО
    res.json({ success: true, promoCode: finalCode });
  });

  // 3. Уведомление о проигрыше
  app.post("/api/game/loss", async (req, res) => {
    const { storageId } = req.body;

    // Просто обновляем запись, что игрок существует
    await storage.createOrUpdatePlayer({ storageId });

    await sendTelegramMessage(
      storageId,
      `💔 *Проигрыш*\n\nНе расстраивайтесь! Попробуйте сыграть еще раз, удача скоро улыбнется вам.`,
    );

    res.json({ success: true });
  });

  return httpServer;
}
