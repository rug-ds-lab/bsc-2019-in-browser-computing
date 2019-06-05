var path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    Client: './src/client/Client.js',
    Utils: './examples/matrixfactorization/Utils.js',
    SparseDistArray: './examples/matrixfactorization/SparseDistArray.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'distributed_stream_[name].js',
    library: '[name]'
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