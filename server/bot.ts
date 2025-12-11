import TelegramBot from "node-telegram-bot-api";
import { storage } from "./storage";

// Используем polling для простоты в Replit
const token = process.env.TELEGRAM_BOT_TOKEN;
let bot: TelegramBot | null = null;

if (token) {
  bot = new TelegramBot(token, { polling: true });
  console.log("Telegram bot started...");

  // Обработка команды /start
  bot.onText(/\/start (.+)/, async (msg, match) => {
    const chatId = msg.chat.id.toString();
    const param = match?.[1]; // Параметр после start (например, connect_USER123)

    if (param && param.startsWith("connect_")) {
      const storageId = param.replace("connect_", "");

      // Связываем в базе
      await storage.linkTelegram(storageId, chatId);

      // Достаем игрока, чтобы узнать его последний промокод (если был)
      const player = await storage.getPlayer(storageId);
      const codeMsg = player?.lastPromoCode
        ? `\n\n🎟 Ваш текущий промокод: \`${player.lastPromoCode}\``
        : "";

      bot?.sendMessage(
        chatId,
        `✨ *Аккаунт успешно подключен!* ✨\n\nТеперь результаты ваших игр и эксклюзивные промокоды будут приходить сюда.${codeMsg}\n\nУдачи в игре! 💅`,
        { parse_mode: "Markdown" },
      );
    }
  });
} else {
  console.warn("TELEGRAM_BOT_TOKEN not provided, bot logic disabled.");
}

export async function sendTelegramMessage(storageId: string, message: string) {
  if (!bot) return;
  const player = await storage.getPlayer(storageId);

  if (player && player.telegramChatId) {
    try {
      await bot.sendMessage(player.telegramChatId, message, {
        parse_mode: "Markdown",
      });
    } catch (e) {
      console.error(
        `Failed to send telegram message to ${player.telegramChatId}`,
        e,
      );
    }
  }
}

export const botName = "tic_tac_glamour_bot"; // Замени на юзернейм своего бота без @
