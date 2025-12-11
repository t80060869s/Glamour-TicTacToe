import {
  type User,
  type InsertUser,
  type Player,
  type InsertPlayer,
} from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getPlayer(storageId: string): Promise<Player | undefined>;
  createOrUpdatePlayer(player: InsertPlayer): Promise<Player>;
  linkTelegram(storageId: string, chatId: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private players: Map<string, Player>;

  constructor() {
    this.users = new Map();
    this.players = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getPlayer(storageId: string): Promise<Player | undefined> {
    return this.players.get(storageId);
  }

  async createOrUpdatePlayer(insertPlayer: InsertPlayer): Promise<Player> {
    const existing = this.players.get(insertPlayer.storageId) || {
      storageId: insertPlayer.storageId,
      telegramChatId: null,
      lastPromoCode: null,
      isConnected: false,
    };

    const updated = { ...existing, ...insertPlayer };
    this.players.set(insertPlayer.storageId, updated);
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
      // Если игрока нет (редкий кейс), создаем
      this.players.set(storageId, {
        storageId,
        telegramChatId: chatId,
        lastPromoCode: null,
        isConnected: true,
      });
    }
  }
}

export const storage = new MemStorage();
