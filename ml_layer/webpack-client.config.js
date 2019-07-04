var path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  target:'web',
  node: {
    fs: 'empty'
  },
  context: path.resolve(__dirname, "."),
  entry: {
    'ml_layer.js': [
      path.resolve(__dirname, './src/SparseDistArray.js'),
      path.resolve(__dirname, './src/ParameterMatrix.js'),
    ],
    'client.js': [
      path.resolve(__dirname, './src/MLClient.js'),
    ],
    'webworker.js': [
      path.resolve(__dirname, './src/work.js')
    ]
  },
  output: {
    filename: '[name]',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Machine learning layer',
      excludeChunks: [ 'webworker.js' ]
    })
  ],
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  }
};