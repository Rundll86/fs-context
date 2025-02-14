const { program } = require("commander");
const child_process = require("child_process");
const webpack = require("webpack");
const { merge } = require("webpack-merge");
const WebpackDevServer = require("webpack-dev-server");
/**
 * 
 * @param {string[]} cmd 
 */
async function run(cmd) {
    return new Promise(resolve => {
        console.log(`Running: ${cmd.filter(Boolean).map(e => e.includes(" ") ? '"' + e + '"' : e).join(" ")}`);
        child_process.spawn("powershell", cmd.filter(Boolean), {
            stdio: "inherit"
        }).addListener("exit", e => resolve(e));
    });
};
function checkTenToOne(args) {
    return args.map(arg => {
        if (arg.startsWith('+') && !arg.match(/^\+\d/)) {
            return `-${arg.slice(1)}`;
        };
        return arg;
    });
};
program.description("FS-Context project controller");
program.command("init")
    .description("init workspace, build webpack config files")
    .alias("setup")
    .action(() => {
        console.log("Building webpack config...");
        run(["tsc", "--project", "tsconfig.webpackConfig.json"]);
    });
const buildCommand = program.command("build")
    .description("about building production");
buildCommand.command("extension")
    .description("build extension as production environment")
    .alias("ext")
    .action(() => {
        console.log("Building extension...");
        const extensionConfig = require("./config/webpack/generated/webpack/extension");
        webpack({
            ...extensionConfig.default,
            mode: "production"
        }).compile(err => {
            if (err) {
                console.error(err);
            };
            console.log("Done!");
        });
    });
buildCommand.command("waterbox")
    .description("build WaterBox UI as production environment")
    .alias("ui")
    .action(() => {
        console.log("Building UI...");
        const waterboxConfig = require("./config/webpack/generated/webpack/waterbox");
        webpack({
            ...waterboxConfig.default,
            mode: "production"
        }).compile(err => {
            if (err) {
                console.error(err);
            };
            console.log("Done!");
        });
    });
buildCommand.command("lib")
    .description("build node module as production environment")
    .action(() => {
        console.log("Building node_module...")
        child_process.spawnSync("tsc -p tsconfig.node.json", { stdio: "inherit" });
    });
const devCommand = program.command("dev")
    .description("about dev server");
devCommand.command("extension")
    .description("start extension live server as development environment")
    .alias("ext")
    .action(() => {
        console.log("Running extension development server...");
        const commonConfig = require("./config/webpack/generated/webpack/common");
        const extensionConfig = require("./config/webpack/generated/webpack/extension");
        const compiler = webpack({
            ...extensionConfig.default,
            mode: "development"
        });
        new WebpackDevServer(merge(commonConfig.devServer, extensionConfig.devServer), compiler).start();
    });
devCommand.command("waterbox")
    .description("start WaterBox dev server as development environment")
    .alias("ui")
    .action(() => {
        console.log("Running UI development server...");
        const commonConfig = require("./config/webpack/generated/webpack/common");
        const waterboxConfig = require("./config/webpack/generated/webpack/waterbox");
        const compiler = webpack({
            ...waterboxConfig.default,
            mode: "development"
        });
        new WebpackDevServer(merge(commonConfig.devServer, waterboxConfig.devServer), compiler).start();
    });
program.command("lint")
    .description("check code syntaxes and styles")
    .alias("eslint")
    .option("-f, --fix", null, false)
    .option("-t, --target <target>", null, "src")
    .action(
        /**
         * 
         * @param {{target:string,fix:boolean}} option 
         */
        option => {
            console.log("Linting...");
            run(["eslint", option.target, option.fix ? "--fix" : null]);
        }
    );
program.parse([process.argv[0], process.argv[1], ...checkTenToOne(process.argv.slice(2))]);