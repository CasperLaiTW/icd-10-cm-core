import path from 'path';
import webpack from 'webpack';

export default {
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'bundle.js',
    libraryTarget: 'umd',
  },
  entry: [
    './src/Core.js'
  ],
  plugins:[
    new webpack.DefinePlugin({
      __COMPILED__: JSON.stringify(true),
    }),
  ],
  module: {
    loaders: [
      { test: /\.js$/, loader: 'babel', query: { compact: false } },
      { test: /\.json$/, loader: 'file'}
    ]
  },
}
