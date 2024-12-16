const path = require("path");
const process = require("process");
/**
 * @type {import("webpack").RuleSetRule[]}
 */
const loaderRule = [
    {
        test: /\.d\.ts$/i,
        use: "null-loader"
    },
    {
        test: /\.ts$/i,
        use: "ts-loader",
        // exclude: /\.d\.ts$/i
    },
    {
        test: /\.(html|md)$/i,
        use: "raw-loader"
    }
];
const alias = {
    "@framework": path.resolve(process.cwd(), "src/fs-context"),
    "@src": path.resolve(process.cwd(), "src"),
    "@config": path.resolve(process.cwd(), "config"),
    "@samples": path.resolve(process.cwd(), "src/fs-context/samples")
};
const fileExtensions = [".ts", ".js"];
/**
 * @type {import("webpack-dev-server").Configuration}
 */
const devServer = {
    static: "./",
    client: {
        overlay: false,
        progress: false,
        logging: "none"
    },
    compress: true,
    hot: true,
    liveReload: true,
    setupExitSignals:false
};
/**
 * @type {import("webpack").Configuration}
 */
const staticShow = {
    stats: "normal"
};
module.exports = { loaderRule, alias, fileExtensions, devServer, staticShow };