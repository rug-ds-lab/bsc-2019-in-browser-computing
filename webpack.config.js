var path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/client/Client.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'distributed_stream_client.js',
    library: 'Client'
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