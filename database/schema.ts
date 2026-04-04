import * as SQLite from "expo-sqlite";

export const DATABASE_NAME = "ticketing_system.db";

export async function initializeDatabase(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

  // Create Users table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      full_name TEXT NOT NULL,
      student_id TEXT,
      phone TEXT,
      role TEXT NOT NULL DEFAULT 'student',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create Tickets table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      priority TEXT DEFAULT 'medium',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME,
      last_admin_view_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
  `);

  // Create Attachments table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_type TEXT,
      file_size INTEGER,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets (id) ON DELETE CASCADE
    );
  `);

  // Create Comments table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      comment TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets (id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
  `);

  // Create Status History table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL,
      old_status TEXT,
      new_status TEXT NOT NULL,
      changed_by INTEGER NOT NULL,
      changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets (id) ON DELETE CASCADE,
      FOREIGN KEY (changed_by) REFERENCES users (id)
    );
  `);

  // Create Notifications table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      ticket_id INTEGER,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info',
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (ticket_id) REFERENCES tickets (id) ON DELETE CASCADE
    );
  `);

  // Add last_admin_view_at column if it doesn't exist (migration for existing databases)
  try {
    await db.execAsync(`
      ALTER TABLE tickets ADD COLUMN last_admin_view_at DATETIME;
    `);
    console.log("Added last_admin_view_at column to tickets table");
  } catch (error: any) {
    // Column already exists or other error - that's fine
    if (!error.message.includes("duplicate column")) {
      console.log("Column migration note:", error.message);
    }
  }

  // Create indexes for better performance
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
    CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
    CREATE INDEX IF NOT EXISTS idx_attachments_ticket_id ON attachments(ticket_id);
    CREATE INDEX IF NOT EXISTS idx_comments_ticket_id ON comments(ticket_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
  `);

  console.log("Database initialized successfully");
  return db;
}

export async function seedAdminUser(db: SQLite.SQLiteDatabase) {
  // Check if admin exists
  const result = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM users WHERE role = ?",
    ["admin"],
  );

  if (result && result.count === 0) {
    // Create default admin account
    await db.runAsync(
      "INSERT INTO users (email, password, full_name, role) VALUES (?, ?, ?, ?)",
      ["admin@spms.edu", "admin123", "System Administrator", "admin"],
    );
    console.log("Default admin user created");
  }
}
