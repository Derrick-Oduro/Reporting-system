// Test script to verify backend API is working
// Run with: node backend/test-backend.js

const http = require("http");

console.log("🧪 Testing Backend API...\n");

// Test 1: Health check
console.log("Test 1: Health Check");
http
  .get("http://localhost:3000/health", (res) => {
    let data = "";
    res.on("data", (chunk) => (data += chunk));
    res.on("end", () => {
      if (res.statusCode === 200) {
        console.log("✅ Health check passed");
        console.log("   Response:", data);
        testLogin();
      } else {
        console.log("❌ Health check failed");
        console.log("   Status:", res.statusCode);
        process.exit(1);
      }
    });
  })
  .on("error", (err) => {
    console.log("❌ Cannot connect to backend server");
    console.log("   Error:", err.message);
    console.log("\n💡 Make sure the backend server is running:");
    console.log("   cd backend && npm run dev\n");
    process.exit(1);
  });

// Test 2: Login
function testLogin() {
  console.log("\nTest 2: Admin Login");

  const postData = JSON.stringify({
    email: "admin@system.com",
    password: "admin123",
  });

  const options = {
    hostname: "localhost",
    port: 3000,
    path: "/api/auth/login",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(postData),
    },
  };

  const req = http.request(options, (res) => {
    let data = "";
    res.on("data", (chunk) => (data += chunk));
    res.on("end", () => {
      if (res.statusCode === 200) {
        const response = JSON.parse(data);
        console.log("✅ Login successful");
        console.log("   User:", response.user.email);
        console.log("   Role:", response.user.role);
        console.log("   Token:", response.token.substring(0, 20) + "...");
        testComplete();
      } else {
        console.log("❌ Login failed");
        console.log("   Status:", res.statusCode);
        console.log("   Response:", data);
        process.exit(1);
      }
    });
  });

  req.on("error", (err) => {
    console.log("❌ Login request failed");
    console.log("   Error:", err.message);
    process.exit(1);
  });

  req.write(postData);
  req.end();
}

function testComplete() {
  console.log("\n🎉 All tests passed!");
  console.log("\n✅ Your backend is working correctly!");
  console.log("\nNext steps:");
  console.log("1. Update config/api.config.ts with your IP address");
  console.log("2. Start the mobile app: npm start");
  console.log("3. Login with admin@system.com / admin123\n");
  process.exit(0);
}
