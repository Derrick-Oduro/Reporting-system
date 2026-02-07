import * as SQLite from "expo-sqlite";
import { User } from "../types";

export class AuthService {
  private db: SQLite.SQLiteDatabase;

  constructor(database: SQLite.SQLiteDatabase) {
    this.db = database;
  }

  async register(
    email: string,
    password: string,
    fullName: string,
    studentId?: string,
    phone?: string,
  ): Promise<User> {
    try {
      const result = await this.db.runAsync(
        "INSERT INTO users (email, password, full_name, student_id, phone, role) VALUES (?, ?, ?, ?, ?, ?)",
        [
          email,
          password,
          fullName,
          studentId || null,
          phone || null,
          "student",
        ],
      );

      const user = await this.db.getFirstAsync<User>(
        "SELECT id, email, full_name, student_id, phone, role, created_at FROM users WHERE id = ?",
        [result.lastInsertRowId],
      );

      if (!user) {
        throw new Error("Failed to create user");
      }

      return user;
    } catch (error: any) {
      if (error.message.includes("UNIQUE constraint failed")) {
        throw new Error("Email already exists");
      }
      throw error;
    }
  }

  async login(email: string, password: string): Promise<User> {
    const user = await this.db.getFirstAsync<User>(
      "SELECT id, email, full_name, student_id, phone, role, created_at FROM users WHERE email = ? AND password = ?",
      [email, password],
    );

    if (!user) {
      throw new Error("Invalid email or password");
    }

    return user;
  }

  async getUserById(userId: number): Promise<User | null> {
    const user = await this.db.getFirstAsync<User>(
      "SELECT id, email, full_name, student_id, phone, role, created_at FROM users WHERE id = ?",
      [userId],
    );

    return user || null;
  }

  async updateProfile(
    userId: number,
    updates: {
      full_name?: string;
      student_id?: string;
      phone?: string;
    },
  ): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.full_name) {
      fields.push("full_name = ?");
      values.push(updates.full_name);
    }
    if (updates.student_id) {
      fields.push("student_id = ?");
      values.push(updates.student_id);
    }
    if (updates.phone) {
      fields.push("phone = ?");
      values.push(updates.phone);
    }

    if (fields.length === 0) return;

    values.push(userId);
    await this.db.runAsync(
      `UPDATE users SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );
  }

  async changePassword(
    userId: number,
    oldPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.db.getFirstAsync<{ password: string }>(
      "SELECT password FROM users WHERE id = ?",
      [userId],
    );

    if (!user || user.password !== oldPassword) {
      throw new Error("Current password is incorrect");
    }

    await this.db.runAsync("UPDATE users SET password = ? WHERE id = ?", [
      newPassword,
      userId,
    ]);
  }
}
