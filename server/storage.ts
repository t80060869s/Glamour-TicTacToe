import { type Player, type InsertPlayer } from "@shared/schema";
import fs from "fs";
import path from "path";

export interface IStorage {
  getPlayer(storageId: string): Promise<Player | undefined>;
  createOrUpdatePlayer(
    player: Partial<InsertPlayer> & { storageId: string },
  ): Promise<Player>;
  linkTelegram(storageId: string, chatId: string): Promise<void>;
}

export class FileStorage implements IStorage {
  private players: Map<string, Player>;
  private filePath: string;

  constructor() {
    this.players = new Map();
    // Файл будет лежать в корне проекта
    this.filePath = path.join(process.cwd(), "database.json");
    this.loadData();
  }

  // Загружаем данные из файла при старте
  private loadData() {
    try {
      if (fs.existsSync(this.filePath)) {
        const rawData = fs.readFileSync(this.filePath, "utf-8");
        const parsedData = JSON.parse(rawData);
        // Восстанавливаем Map из массива
        this.players = new Map(parsedData);
        console.log(`[Storage] Loaded ${this.players.size} players from disk.`);
      }
    } catch (e) {
      console.error("[Storage] Failed to load data:", e);
      // Если файл битый, начинаем с чистого листа
      this.players = new Map();
    }
  }

  // Сохраняем данные в файл при каждом изменении
  private saveData() {
    try {
      // Превращаем Map в массив пар для сохранения в JSON
      const dataToSave = Array.from(this.players.entries());
      fs.writeFileSync(this.filePath, JSON.stringify(dataToSave, null, 2));
    } catch (e) {
      console.error("[Storage] Failed to save data:", e);
    }
  }

  async getPlayer(storageId: string): Promise<Player | undefined> {
    return this.players.get(storageId);
  }

  async createOrUpdatePlayer(
    insertPlayer: Partial<InsertPlayer> & { storageId: string },
  ): Promise<Player> {
    const existing = this.players.get(insertPlayer.storageId) || {
      storageId: insertPlayer.storageId,
      telegramChatId: null,
      lastPromoCode: null,
      isConnected: false,
    };

    const updated = { ...existing, ...insertPlayer };
    this.players.set(insertPlayer.storageId, updated);

    // Сохраняем сразу после изменения
    this.saveData();

    return updated;
  }

  async linkTelegram(storageId: string, chatId: string): Promise<void> {
    const player = this.players.get(storageId);
    if (player) {
      this.players.set(storageId, {
        ...player,
        telegramChatId: chatId,
        isConnected: true,
      });
    } else {
      this.players.set(storageId, {
        storageId,
        telegramChatId: chatId,
        lastPromoCode: null,
        isConnected: true,
      });
    }
    // Сохраняем сразу после изменения
    this.saveData();
  }
}

export const storage = new FileStorage();
