const fs = require("fs");
const path = require("path");
const initSqlJs = require("sql.js");

async function testAttachmentInsert() {
  const dbPath = path.join(__dirname, "database.db");

  if (!fs.existsSync(dbPath)) {
    console.log("❌ Database file does not exist");
    return;
  }

  const SQL = await initSqlJs();
  const buffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(buffer);

  console.log("=== CHECKING ATTACHMENTS TABLE SCHEMA ===");
  const schema = db.exec("PRAGMA table_info(attachments)");
  if (schema.length > 0) {
    console.log("Columns in attachments table:");
    schema[0].values.forEach((row) => {
      console.log(`  - ${row[1]} (${row[2]})${row[3] ? " NOT NULL" : ""}`);
    });
  }
  console.log("");

  // Check if there are any tickets
  console.log("=== CHECKING TICKETS ===");
  const tickets = db.exec("SELECT id, title FROM tickets LIMIT 1");
  if (tickets.length === 0 || tickets[0].values.length === 0) {
    console.log("❌ No tickets found. Create a ticket first!");
    db.close();
    return;
  }

  const ticketId = tickets[0].values[0][0];
  console.log("✅ Found ticket ID:", ticketId);
  console.log("");

  // Try to insert a test attachment
  console.log("=== ATTEMPTING TEST INSERT ===");
  try {
    db.run(
      `
      INSERT INTO attachments (ticket_id, file_name, file_path, file_type, file_size)
      VALUES (?, ?, ?, ?, ?)
    `,
      [ticketId, "test.pdf", "/path/to/test.pdf", "application/pdf", 12345],
    );

    // Save database
    const data = db.export();
    const newBuffer = Buffer.from(data);
    fs.writeFileSync(dbPath, newBuffer);

    console.log("✅ Test attachment inserted successfully!");

    // Verify it was inserted
    const attachments = db.exec("SELECT * FROM attachments");
    if (attachments.length > 0 && attachments[0].values.length > 0) {
      console.log("");
      console.log("=== ALL ATTACHMENTS IN DATABASE ===");
      attachments[0].values.forEach((row, index) => {
        console.log(`Attachment ${index + 1}:`);
        console.log("  ID:", row[0]);
        console.log("  Ticket ID:", row[1]);
        console.log("  File Name:", row[2]);
        console.log("  File Path:", row[3]);
        console.log("  File Type:", row[4]);
        console.log("  File Size:", row[5]);
        console.log("  Uploaded At:", row[6]);
      });
    }
  } catch (error) {
    console.error("❌ Error inserting attachment:", error.message);
  }

  db.close();
}

testAttachmentInsert().catch(console.error);
