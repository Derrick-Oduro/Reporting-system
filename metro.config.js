const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add resolver configuration to handle missing expo-router assets and WASM files
config.resolver = {
  ...config.resolver,
  assetExts: [
    ...(config.resolver?.assetExts || []),
    "png",
    "jpg",
    "jpeg",
    "gif",
    "wasm",
  ],
  sourceExts: [
    ...(config.resolver?.sourceExts || []),
    "jsx",
    "js",
    "ts",
    "tsx",
    "json",
    "wasm",
  ],
};

module.exports = config;
