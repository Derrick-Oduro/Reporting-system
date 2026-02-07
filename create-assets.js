const fs = require("fs");
const path = require("path");
const https = require("https");

const assetsDir = path.join(__dirname, "node_modules", "expo-router", "assets");
const files = ["file.png", "folder.png", "pkg.png", "logotype.png"];

const baseUrl =
  "https://raw.githubusercontent.com/expo/expo/sdk-51/packages/expo-router/assets/";

async function downloadFile(filename) {
  return new Promise((resolve, reject) => {
    const url = baseUrl + filename;
    const filePath = path.join(assetsDir, filename);

    https
      .get(url, (response) => {
        if (response.statusCode === 200) {
          const fileStream = fs.createWriteStream(filePath);
          response.pipe(fileStream);
          fileStream.on("finish", () => {
            fileStream.close();
            console.log(`✓ Downloaded ${filename}`);
            resolve();
          });
        } else {
          // If file doesn't exist on GitHub, create a minimal 1x1 transparent PNG
          console.log(`Creating placeholder for ${filename}`);
          const minimalPNG = Buffer.from(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
            "base64",
          );
          fs.writeFileSync(filePath, minimalPNG);
          resolve();
        }
      })
      .on("error", (err) => {
        // On error, create placeholder
        console.log(
          `Creating placeholder for ${filename} (error: ${err.message})`,
        );
        const minimalPNG = Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
          "base64",
        );
        fs.writeFileSync(filePath, minimalPNG);
        resolve();
      });
  });
}

async function main() {
  console.log("Creating missing expo-router assets...");

  // Ensure assets directory exists
  if (!fs.existsSync(assetsDir)) {
    console.log("Creating assets directory...");
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  // Download all files
  for (const file of files) {
    await downloadFile(file);
  }

  console.log("\n✓ All assets created successfully!");
  console.log(
    "You can now restart your Expo dev server with: npx expo start -c",
  );
}

main().catch(console.error);
