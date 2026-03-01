const fs = require("fs");
const path = require("path");
const initSqlJs = require("sql.js");

async function checkDatabase() {
  const dbPath = path.join(__dirname, "database.db");

  if (!fs.existsSync(dbPath)) {
    console.log("❌ Database file does not exist at:", dbPath);
    return;
  }

  console.log("✅ Database file found at:", dbPath);
  console.log("");

  const SQL = await initSqlJs();
  const buffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(buffer);

  // Check tables
  console.log("=== TABLES IN DATABASE ===");
  const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
  if (tables.length > 0) {
    tables[0].values.forEach((row) => console.log("-", row[0]));
  }
  console.log("");

  // Check tickets
  console.log("=== TICKETS ===");
  const tickets = db.exec(
    "SELECT id, title, created_at FROM tickets ORDER BY id DESC LIMIT 5",
  );
  if (tickets.length > 0 && tickets[0].values.length > 0) {
    console.log("Latest tickets:");
    tickets[0].values.forEach((row) => {
      console.log(`  Ticket #${row[0]}: ${row[1]}`);
    });
  } else {
    console.log("No tickets found");
  }
  console.log("");

  // Check attachments
  console.log("=== ATTACHMENTS ===");
  const attachments = db.exec("SELECT * FROM attachments ORDER BY id DESC");
  if (attachments.length > 0 && attachments[0].values.length > 0) {
    console.log("Found", attachments[0].values.length, "attachments:");
    attachments[0].values.forEach((row) => {
      console.log("  ID:", row[0]);
      console.log("  Ticket ID:", row[1]);
      console.log("  File Name:", row[2]);
      console.log("  File Path:", row[3]);
      console.log("  File Type:", row[4]);
      console.log("  File Size:", row[5]);
      console.log("  Uploaded At:", row[6]);
      console.log("  ---");
    });
  } else {
    console.log("⚠️  No attachments found in database!");
  }
  console.log("");

  // Check attachments by ticket
  const ticketsWithAttachments = db.exec(`
    SELECT t.id, t.title, COUNT(a.id) as attachment_count
    FROM tickets t
    LEFT JOIN attachments a ON t.id = a.ticket_id
    GROUP BY t.id
    HAVING attachment_count > 0
  `);

  if (
    ticketsWithAttachments.length > 0 &&
    ticketsWithAttachments[0].values.length > 0
  ) {
    console.log("=== TICKETS WITH ATTACHMENTS ===");
    ticketsWithAttachments[0].values.forEach((row) => {
      console.log(
        `  Ticket #${row[0]} "${row[1]}" has ${row[2]} attachment(s)`,
      );
    });
  } else {
    console.log("=== NO TICKETS HAVE ATTACHMENTS ===");
  }

  db.close();
}

checkDatabase().catch(console.error);
