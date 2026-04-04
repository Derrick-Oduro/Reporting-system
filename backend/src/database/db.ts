import bcrypt from "bcryptjs";
import Database from "better-sqlite3";
import path from "path";

const dbPath =
  process.env.DATABASE_PATH || path.join(__dirname, "../../database.db");

const db: Database.Database = new Database(dbPath);

// Enable foreign keys
db.pragma("foreign_keys = ON");

function hasColumn(tableName: string, columnName: string) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{
    name: string;
  }>;
  return columns.some((column) => column.name === columnName);
}

export async function initializeDatabase() {
  console.log("Initializing database...");

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      full_name TEXT NOT NULL,
      student_id TEXT,
      phone TEXT,
      role TEXT NOT NULL DEFAULT 'student',
      is_verified INTEGER NOT NULL DEFAULT 0,
      verified_at DATETIME,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.exec(`
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

  db.exec(`
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

  db.exec(`
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

  db.exec(`
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

  // Migration: Add last_admin_view_at column if it doesn't exist
  try {
    db.exec(`ALTER TABLE tickets ADD COLUMN last_admin_view_at DATETIME;`);
    console.log("Added last_admin_view_at column to tickets table");
  } catch (error: any) {
    // Column already exists - that's fine
    if (!error.message.includes("duplicate column")) {
      console.log("Migration note:", error.message);
    }
  }

  // Migration: add user verification fields for existing databases
  try {
    db.exec(
      `ALTER TABLE users ADD COLUMN is_verified INTEGER NOT NULL DEFAULT 0;`,
    );
    console.log("Added is_verified column to users table");
  } catch (error: any) {
    if (!error.message.includes("duplicate column")) {
      console.log("Migration note:", error.message);
    }
  }

  try {
    db.exec(`ALTER TABLE users ADD COLUMN verified_at DATETIME;`);
    console.log("Added verified_at column to users table");
  } catch (error: any) {
    if (!error.message.includes("duplicate column")) {
      console.log("Migration note:", error.message);
    }
  }

  if (!hasColumn("users", "updated_at")) {
    try {
      // SQLite cannot add a column with a non-constant default via ALTER TABLE.
      db.exec(`ALTER TABLE users ADD COLUMN updated_at DATETIME;`);
      db.exec(
        `UPDATE users SET updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP);`,
      );
      console.log("Added updated_at column to users table");
    } catch (error: any) {
      console.log("Migration note:", error.message);
    }
  }

  console.log("Database initialized successfully");

  // Seed admin user if not exists
  seedAdminUser();
}

function seedAdminUser() {
  const usersHasUpdatedAt = hasColumn("users", "updated_at");

  const ensureAdminUser = (email: string, fullName: string) => {
    const adminExists = db
      .prepare("SELECT id FROM users WHERE LOWER(email) = LOWER(?)")
      .get(email);

    if (!adminExists) {
      const hashedPassword = bcrypt.hashSync("admin123", 10);
      const stmt = db.prepare(`
        INSERT INTO users (email, password, full_name, role, is_verified, verified_at)
        VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
      `);

      stmt.run(email, hashedPassword, fullName, "admin");
      console.log(`Admin user created: ${email} / admin123`);
      return;
    }

    // Keep known admin accounts verified if they existed before migrations.
    const updateQuery = usersHasUpdatedAt
      ? "UPDATE users SET role = 'admin', is_verified = 1, verified_at = COALESCE(verified_at, CURRENT_TIMESTAMP), updated_at = CURRENT_TIMESTAMP WHERE LOWER(email) = LOWER(?)"
      : "UPDATE users SET role = 'admin', is_verified = 1, verified_at = COALESCE(verified_at, CURRENT_TIMESTAMP) WHERE LOWER(email) = LOWER(?)";

    db.prepare(updateQuery).run(email);
  };

  ensureAdminUser("admin@system.com", "System Administrator");
  ensureAdminUser("admin@spms.edu", "SPMS Administrator");
}

export default db;
