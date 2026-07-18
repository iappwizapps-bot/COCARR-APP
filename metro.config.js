const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const {
    wrapWithReanimatedMetroConfig,
  } = require('react-native-reanimated/metro-config');
/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {};

// module.exports = ;

module.exports = wrapWithReanimatedMetroConfig(
  mergeConfig(
    getDefaultConfig(__dirname),
    (async () => {
      const {
        resolver: { sourceExts, assetExts },
      } = getDefaultConfig(__dirname);
      return {
        transformer: {
          babelTransformerPath: require.resolve('react-native-svg-transformer'),
        },
        resolver: {
          assetExts: assetExts.filter(ext => ext !== 'svg'),
          sourceExts: [...sourceExts, 'svg'],
        },
      };
    })()
  )
);
