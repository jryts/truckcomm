module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // ... other plugins like 'react-native-reanimated/plugin'
      'react-native-paper/babel'
    ],
  };
};
