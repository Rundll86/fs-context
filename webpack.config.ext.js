const WebpackBar = require("webpackbar");
const path = require("path");
const serverConfig = require("./config/server");
const commonConfig = require("./config/webpack");
const FriendlyErrorsWebpackPlugin = require("friendly-errors-webpack-plugin");
const webpack = require("webpack");
/**
 * @type {import('webpack').Configuration}
 */
module.exports = {
    ...commonConfig.staticShow,
    entry: "@framework/entry.ts",
    output: {
        filename: `${serverConfig.extension.output}.dist.js`,
        path: path.resolve(__dirname, `dist/${serverConfig.extension.output}`),
        clean: true
    },
    module: {
        rules: [
            ...commonConfig.loaderRule,
            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader"]
            }
        ]
    },
    resolve: {
        extensions: [...commonConfig.fileExtensions],
        alias: commonConfig.alias
    },
    plugins: [
        new WebpackBar({
            name: "Extension",
            color: "green"
        }),
        new FriendlyErrorsWebpackPlugin({
            compilationSuccessInfo: {
                messages: [
                    `Live is running on http://127.0.0.1:${serverConfig.extension.port}/${serverConfig.extension.output}.dist.js`
                ]
            },
            clearConsole: true
        }),
        new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 })
    ],
    devServer: {
        ...commonConfig.devServer,
        headers: {
            'Access-Control-Allow-Origin': '*'
        },
        port: serverConfig.extension.port,
        hot: false,
        liveReload: false,
        webSocketServer: false
    },
    optimization: {
        splitChunks: false,
        runtimeChunk: false,
        minimize: true,
        concatenateModules: true,
        removeEmptyChunks: true,
    }
};