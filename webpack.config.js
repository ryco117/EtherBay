const path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
  	index: './app/javascripts/index.js',
  	request: './app/javascripts/request.js',
  	freebies: './app/javascripts/freebies.js',
  	flags: './app/javascripts/flags.js'
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name].js'
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'app/index.html',
      chunks: ['index']
    }),
    new HtmlWebpackPlugin({
      filename: 'request.html',
      template: 'app/request.html',
      chunks: ['request']
    }),
    new HtmlWebpackPlugin({
      filename: 'freebies.html',
      template: 'app/freebies.html',
      chunks: ['freebies']
    }),
    new HtmlWebpackPlugin({
      filename: 'flags.html',
      template: 'app/flags.html',
      chunks: ['flags']
    })
  ],
  module: {
    rules: [
      {
       test: /\.css$/,
       use: [ 'style-loader', 'css-loader' ]
      }
    ],
    loaders: [
      { test: /\.json$/, use: 'json-loader' },
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015'],
          plugins: ['transform-runtime']
        }
      }
    ]
  }
}
