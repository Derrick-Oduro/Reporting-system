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

import Constants from "expo-constants";
import { Platform } from "react-native";

function getDevApiBaseUrl() {
  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri?.split(":")[0];

  // When Expo is running on a LAN host (physical devices), reuse that host.
  if (host && host !== "localhost" && host !== "127.0.0.1") {
    return `http://${host}:3000/api`;
  }

  // Emulator/simulator defaults.
  if (Platform.OS === "android") {
    return "http://10.0.2.2:3000/api";
  }

  return "http://localhost:3000/api";
}

export const API_CONFIG = {
  BASE_URL: __DEV__
    ? getDevApiBaseUrl()
    : "https://your-production-api.com/api",
  TIMEOUT: 10000,
};

export default API_CONFIG;
