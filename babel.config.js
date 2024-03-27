module.exports = function (api) {
  api.cache(true)

  return {
    presets: ['module:@react-native/babel-preset'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['.'],
          extensions: [
            '.js',
            '.jsx',
            '.ts',
            '.tsx',
            '.android.js',
            '.android.tsx',
            '.ios.js',
            '.ios.tsx',
          ],
          alias: {
            '@': './',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  }
}
