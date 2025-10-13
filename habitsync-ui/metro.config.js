const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Alias victory-native to victory for web platform
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'victory-native') {
    return context.resolveRequest(context, 'victory', platform);
  }

  // Ensure you call the default resolver
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

