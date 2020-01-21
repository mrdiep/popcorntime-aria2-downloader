const resolve = require('path').resolve
require("@babel/polyfill");
const HtmlWebpackPlugin = require('html-webpack-plugin');
var HtmlWebpackPugPlugin = require('html-webpack-pug-plugin');
module.exports = {
  target: 'node',
  node: {
    __dirname: false,
    __filename: false,
  },
  entry: [ '@babel/polyfill', './src/app.js' ],
  output: {
    filename: "app.js",
    path: resolve(__dirname, './../dist')
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/views/index.pug',
      filename: 'output.pug'
    }),
    new HtmlWebpackPugPlugin()
  ],
  externals: ['aws-sdk', 'utf-8-validate', 'bufferutil'],
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /node_modules/,
        use: ['babel-loader']
      },
      { 
        test: /\.pug$/,
        use: ['pug-loader']
      },
    ]
  },
  resolve: {
    extensions: ['*', '.js', '.pug']
  },
}
