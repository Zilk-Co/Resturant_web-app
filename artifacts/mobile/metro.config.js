const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  '@': path.resolve(__dirname),
};

config.resolver.blockList = [
  /node_modules[/\\]\.pnpm[/\\]@google-cloud[^/\\]*[/\\].*_tmp_[^/\\]*[/\\].*/,
  /node_modules[/\\]@google-cloud[/\\].*_tmp_[^/\\]*[/\\].*/,
];

module.exports = config;
