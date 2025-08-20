const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: (webpackConfig, { env }) => {
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        '@mui/material': '@mui/material',
        '@mui/icons-material': '@mui/icons-material',
      };

      if (env === 'production') {
        webpackConfig.optimization.splitChunks = {
          chunks: 'all',
          cacheGroups: {
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              name: 'react',
              chunks: 'initial',
              priority: 30,
              reuseExistingChunk: true,
            },
            mui: {
              test: /[\\/]node_modules[\\/]@mui[\\/]/,
              name: 'mui',
              chunks: 'initial',
              priority: 20,
              reuseExistingChunk: true,
            },
            vendors: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'initial',
              minChunks: 2,
              priority: 10,
              reuseExistingChunk: true,
            },
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
          },
        };

        webpackConfig.plugins.push(
          new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('production'),
          })
        );
      }

      return webpackConfig;
    },
  },

  babel: {
    configure: (babelConfig, { env }) => {
      const plugins = [
        [
          'babel-plugin-import',
          {
            libraryName: '@mui/material',
            libraryDirectory: '',
            camel2DashComponentName: false,
          },
          'mui-core',
        ],
        [
          'babel-plugin-import',
          {
            libraryName: '@mui/icons-material',
            libraryDirectory: '',
            camel2DashComponentName: false,
          },
          'mui-icons',
        ],
      ];

      if (env === 'production') {
        plugins.push('babel-plugin-transform-remove-console');
      }

      babelConfig.plugins = [...(babelConfig.plugins || []), ...plugins];
      return babelConfig;
    },
  },
};

