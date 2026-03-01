// API Configuration
// Update BASE_URL based on where you're running the backend:
//
// FOR IOS SIMULATOR:
//   Use: http://localhost:3000/api
//
// FOR ANDROID EMULATOR:
//   Use: http://10.0.2.2:3000/api
//
// FOR PHYSICAL DEVICE (phone/tablet):
//   Use: http://YOUR_COMPUTER_IP:3000/api
//   Find your IP: Run 'ipconfig' (Windows) or 'ifconfig' (Mac/Linux)
//   Example: http://192.168.1.100:3000/api
//
// FOR PRODUCTION:
//   Use your deployed API URL: https://your-app.railway.app/api

export const API_CONFIG = {
  BASE_URL: __DEV__
    ? "http://172.20.10.2:3000/api" // 👈 CHANGE THIS FOR ANDROID EMULATOR OR PHYSICAL DEVICE
    : "https://your-production-api.com/api",
  TIMEOUT: 10000,
};

export default API_CONFIG;
