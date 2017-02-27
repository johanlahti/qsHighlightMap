const webpack = require('webpack');
const path = require('path');
const libraryName = 'qsHighlightMap';
// const fs = require("fs");

// The value of `debug` decides on:
// - what plugins to use
// - inline-map or not
const debug = true; //process.env.NODE_ENV !== "production";

const config = {
	//context: path.join(__dirname, "src"),
	entry: './src/js/qsHighlightMap.js', //entries, //'./src/js/index.js',
	devtool: debug ? "inline-sourcemap" : null,
	output: {
		path: path.join(__dirname, "dist"),
		filename: libraryName + ".js", //'[name]',
		library: libraryName,
		libraryTarget: "var", //'umd',
		umdNamedDefine: false
	},
	module: {
		loaders: [
			{
				test: /\.js$/,
				loader: 'babel',
				exclude: /(node_modules|dist|mockup)/,
				query: {
					presets: ['latest'],
					plugins: ['transform-class-properties']
				}
			}
		]
	},
	externals: {
		"jquery": "$",
		"define": "define"
	},
	// resolve: {
	// 	root: path.resolve('./src'),
	// 	extensions: ['', '.js']
	// },

	plugins: debug ? [] : [
		new webpack.optimize.DedupePlugin(),
		new webpack.optimize.OccurenceOrderPlugin(),
		new webpack.optimize.UglifyJsPlugin({ mangle: false, sourcemap: false })
	]
};

module.exports = config;
