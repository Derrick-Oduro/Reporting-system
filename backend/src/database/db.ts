import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import initSqlJs, { Database } from "sql.js";

const dbPath =
  process.env.DATABASE_PATH || path.join(__dirname, "../../database.db");

let sqlDb: Database;

async function loadDatabase(): Promise<Database> {
  const SQL = await initSqlJs();

  // Try to load existing database
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    return new SQL.Database(buffer);
  }

  // Create new database
  return new SQL.Database();
}

async function getDb(): Promise<Database> {
  if (!sqlDb) {
    sqlDb = await loadDatabase();
  }
  return sqlDb;
}

function saveDatabase() {
  if (sqlDb) {
    const data = sqlDb.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

// Wrapper to make it look like better-sqlite3
class DbWrapper {
  prepare(sql: string) {
    return {
      get: (...params: any[]) => {
        if (!sqlDb) return null;
        try {
          const results = sqlDb.exec(sql, params);
          if (results.length === 0 || results[0].values.length === 0)
            return null;

          const obj: any = {};
          results[0].columns.forEach((col: string, idx: number) => {
            obj[col] = results[0].values[0][idx];
          });
          return obj;
        } catch (error) {
          return null;
        }
      },
      all: (...params: any[]) => {
        if (!sqlDb) return [];
        try {
          const results = sqlDb.exec(sql, params);
          if (results.length === 0) return [];

          return results[0].values.map((row: any[]) => {
            const obj: any = {};
            results[0].columns.forEach((col: string, idx: number) => {
              obj[col] = row[idx];
            });
            return obj;
          });
        } catch (error) {
          return [];
        }
      },
      run: (...params: any[]) => {
        if (!sqlDb) return { lastInsertRowid: 0, changes: 0 };
        try {
          sqlDb.run(sql, params);
          saveDatabase();

          // Get last insert id
          const result = sqlDb.exec("SELECT last_insert_rowid() as id");
          const lastInsertRowid =
            result.length > 0 && result[0].values.length > 0
              ? (result[0].values[0][0] as number)
              : 0;

          return {
            lastInsertRowid,
            changes: 1,
          };
        } catch (error) {
          console.error("Database run error:", error);
          return { lastInsertRowid: 0, changes: 0 };
        }
      },
    };
  }

  exec(sql: string) {
    if (sqlDb) {
      sqlDb.run(sql);
      saveDatabase();
    }
  }

  pragma(pragma: string) {
    // sql.js doesn't support pragma, but we can ignore it
    return;
  }
}

const db = new DbWrapper();

export async function initializeDatabase() {
  // Initialize the database (loads or creates it)
  await getDb();

  // Now use the db wrapper to create tables
  db.exec(`
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
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
  `);

  // Create Attachments table
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

  // Create Comments table
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

  // Create Notifications table
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

  saveDatabase();
  console.log("Database initialized successfully");

  // Seed admin user if not exists
  seedAdminUser();
}

function seedAdminUser() {
  const adminExists = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get("admin@system.com");

  if (!adminExists) {
    const hashedPassword = bcrypt.hashSync("admin123", 10);
    const stmt = db.prepare(`
      INSERT INTO users (email, password, full_name, role)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(
      "admin@system.com",
      hashedPassword,
      "System Administrator",
      "admin",
    );
    console.log("Admin user created: admin@system.com / admin123");
  }
}

export default db;
