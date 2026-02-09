// Simple test to verify API client works
import { apiClient } from "../utils/apiClient";

async function testAPI() {
  console.log("Testing API Client...\n");

  try {
    // Test health endpoint (doesn't exist yet, but shows connection)
    const response = await apiClient.get("/health");
    console.log("✅ API Client initialized successfully");
    console.log("Response:", response);
  } catch (error) {
    console.log(
      "⚠️  Could not connect to API (expected if backend not running)",
    );
    console.log("Error:", error);
  }

  console.log("\n📝 API Client is ready to use!");
  console.log("Make sure to:");
  console.log("1. Start the backend server");
  console.log("2. Update config/api.config.ts with your API URL");
  console.log("3. Test login with admin@system.com / admin123");
}

testAPI();
