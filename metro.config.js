const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  // Enables CSS support in Metro.
  isCSSEnabled: true,
});

// Add support for WASM files.
config.resolver.assetExts.push('wasm');

module.exports = config;
