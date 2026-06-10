// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// This is a fix for the `@react-native-firebase` module resolution error
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  "@react-native-firebase/app": path.resolve(__dirname, 'node_modules/@react-native-firebase/app/lib/common/index.js'),
};

// Ignore the dot-prefixed temporary staging directories that npm/yarn create
// inside node_modules during installs (e.g. `.expo-dev-launcher-XXXXXXXX`).
// On Windows these get removed mid-watch and crash Metro's file watcher with
// `ENOENT: no such file or directory, watch`. Skipping them stops the watcher
// from ever trying to watch a transient directory. The pattern matches both
// `/` and `\` separators, so it is safe across platforms.
const stagingDirPattern = /[/\\]node_modules[/\\]\.[^/\\]+[/\\].*/;
config.resolver.blockList = Array.isArray(config.resolver.blockList)
  ? [...config.resolver.blockList, stagingDirPattern]
  : [config.resolver.blockList, stagingDirPattern].filter(Boolean);

module.exports = config;