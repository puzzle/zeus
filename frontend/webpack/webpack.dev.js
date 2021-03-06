const webpack = require('webpack');
const writeFilePlugin = require('write-file-webpack-plugin');
const webpackMerge = require('webpack-merge');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');
const SimpleProgressWebpackPlugin = require('simple-progress-webpack-plugin');
const path = require('path');
const sass = require('sass');

const utils = require('./utils.js');
const commonConfig = require('./webpack.common.js');

const ENV = 'development';

module.exports = (options) => webpackMerge(commonConfig({ env: ENV }), {
    devtool: 'eval-source-map',
    devServer: {
        contentBase: './build/www',
        proxy: [{
            context: [
                '/api',
                '/management',
                '/swagger-resources',
                '/v2/api-docs',
                '/h2-console',
                '/auth'
            ],
            target: 'http://127.0.0.1:8080',
            secure: false,
            headers: { host: 'localhost:9000' }
        }, {
            context: [
                '/websocket'
            ],
            target: 'ws://127.0.0.1:8080',
            ws: true
        }],
        stats: options.stats,
        watchOptions: {
            ignored: /node_modules/
        }
    },
    entry: {
        polyfills: './src/app/polyfills',
        global: './src/content/scss/global.scss',
        main: './src/app/app.main'
    },
    output: {
        path: utils.root('build/www'),
        filename: 'app/[name].bundle.js',
        chunkFilename: 'app/[id].chunk.js'
    },
    module: {
        rules: [{
            test: /\.ts$/,
            enforce: 'pre',
            loader: 'tslint-loader',
            exclude: [/(node_modules)/, new RegExp('reflect-metadata\\' + path.sep + 'Reflect\\.ts')]
        },
            {
                test: /\.ts$/,
                use: [
                    'angular2-template-loader',
                    {
                        loader: 'cache-loader',
                        options: {
                            cacheDirectory: path.resolve('build/cache-loader')
                        }
                    },
                    {
                        loader: 'thread-loader',
                        options: {
                            // there should be 1 cpu for the fork-ts-checker-webpack-plugin
                            workers: require('os').cpus().length - 1
                        }
                    },
                    {
                        loader: 'ts-loader',
                        options: {
                            transpileOnly: true,
                            happyPackMode: true
                        }
                    },
                    'angular-router-loader'
                ],
                exclude: /(node_modules)/
            },
            {
                test: /\.scss$/,
                use: ['to-string-loader', 'css-loader', {
                    loader: 'sass-loader',
                    options: { implementation: sass }
                }],
                exclude: /(vendor\.scss|global\.scss)/
            },
            {
                test: /(vendor\.scss|global\.scss)/,
                use: ['style-loader', 'css-loader', 'postcss-loader', {
                    loader: 'sass-loader',
                    options: { implementation: sass }
                }]
            }]
    },
    stats: options.stats,
    plugins: [
        new SimpleProgressWebpackPlugin({
            format: options.stats === 'minimal' ? 'compact' : 'expanded'
        }),
        new FriendlyErrorsWebpackPlugin(),
        new ForkTsCheckerWebpackPlugin(),
        new BrowserSyncPlugin({
            host: 'localhost',
            port: 9000,
            proxy: {
                target: 'http://localhost:9060',
                ws: true
            }
        }, {
            reload: true
        }),
        new webpack.ContextReplacementPlugin(
            /angular(\\|\/)core(\\|\/)/,
            path.resolve(__dirname, './webapp')
        ),
        new writeFilePlugin(),
        new webpack.WatchIgnorePlugin([
            utils.root('test')
        ])
    ],
    mode: 'development'
});
