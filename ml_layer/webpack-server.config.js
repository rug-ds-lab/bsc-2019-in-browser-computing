var path = require('path');

module.exports = {
  mode: 'development',
  target:'node',
  node: {
    __dirname: false,
    __filename: false,
  },
  entry: {
    'server.js': [
      path.resolve(__dirname, './examples/matrixfactorization/server.js'),
    ]
  },
  output: {
    filename: '[name]',
    path: path.resolve(__dirname, 'dist'),
  },
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