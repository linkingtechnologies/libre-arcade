'use strict';

const cssnext = require('postcss-cssnext');
const webpack = require('webpack');

module.exports = {
  entry: './src/index.js',
  module: {
    rules: [
      {
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          cacheDirectory: true,
        },
        test: /\.js$/,
      },
      {
        use: [
          'style-loader',
          'css-loader?importLoaders=1&url=false',
          'postcss-loader',
        ],
        test: /\.css$/,
      },
    ],
  },
  output: {
    filename: 'bundle.js',
    path: 'static',
  },
  plugins: [
    new webpack.LoaderOptionsPlugin({
      options: {
        postcss: () => [cssnext],
      },
    }),
  ],
  resolve: {
    modules: ['node_modules'],
  },
};
