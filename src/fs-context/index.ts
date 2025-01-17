import { ExtensionLoadError, MissingError, UncognizedError } from "./exceptions";
import type {
    ArgumentPlain,
    BlockPlain,
    ExtensionPlain,
    GlobalResourceMachine,
    HexColorString,
    MenuPlain,
    PlatformSupported,
    Scratch,
    ScratchWaterBoxed
} from "./internal";
import { AcceptedInputType } from "./internal";
import type { Extension } from "./structs";
import loaderConfig from "@config/loader";
import serverConfig from "@config/server";
if (!window._FSContext) {
    window._FSContext = {
        EXTENSIONS: {},
        EXPORTED: {}
    };
};
export namespace Extensions {
    async function generateConstructor(extension: typeof Extension): Promise<new (runtime?: Scratch) => ExtensionPlain> {
        const { Version, Menu } = await import("./structs");
        const { Unnecessary } = await import("./tools");
        const ext = extension.onlyInstance;
        const context = getFSContext();
        function ExtensionConstructor(this: ExtensionPlain, runtime?: Scratch): ExtensionPlain {
            if (!runtime?.extensions?.unsandboxed && !ext.allowSandboxed) {
                throw new ExtensionLoadError(`FSExtension "${ext.id}" must be supported unsandboxed.`);
            };
            for (const i in ext.requires) {
                if (!Object.keys(context.EXTENSIONS).includes(i)) {
                    throw new ExtensionLoadError(`FSExtension "${ext.id}" requires ${i} to be loaded.`);
                }
                if (Version.compare(context.EXTENSIONS[i], ext.requires[i]) === ext.requires[i]) {
                    throw new ExtensionLoadError(`FSExtension "${ext.id}" requires ${i} to be at least ${ext.requires[i]}.`);
                };
            };
            ext.init(runtime);
            ext.runtime = runtime;
            if (!ext.allowSandboxed) ext.canvas = runtime?.renderer.canvas;
            ext.blocks.forEach(block => {
                block.arguments.forEach(arg => {
                    if (arg.inputType === "menu" && arg.value instanceof Menu) {
                        ext.menus.push(arg.value);
                        arg.value = arg.value.name;
                    }
                });
            });
            const blocks: BlockPlain[] = [];
            for (const block of ext.blocks) {
                const args: Record<string, ArgumentPlain> = {};
                const currentBlock: BlockPlain = {
                    opcode: block.opcode,
                    blockType: block.type,
                    text: block.text,
                    arguments: args
                };
                for (const arg of block.arguments) {
                    if (arg.type === "input") {
                        const currentArg: ArgumentPlain = {
                            type: Unnecessary.castInputType(arg.inputType),
                        };
                        if (!AcceptedInputType.includes(arg.inputType)) {
                            if (Object.keys(ext.loaders).includes(arg.inputType)) {
                                currentArg.type = "string";
                            };
                        };
                        if (arg.inputType === "menu") {
                            currentArg.menu = arg.value as string;
                        } else {
                            currentArg.defaultValue = arg.value;
                        };
                        args[arg.content] = currentArg;
                    };
                };
                blocks.push(currentBlock);
            };
            const menus: Record<string, MenuPlain> = {};
            for (const menu of ext.menus) {
                menus[menu.name] = {
                    acceptReporters: menu.acceptReporters,
                    items: menu.items.map(item => {
                        return {
                            text: item.name,
                            value: item.value
                        };
                    })
                };
            };
            ext.calcColor();
            const result: ExtensionPlain = {
                getInfo() {
                    return {
                        id: ext.id,
                        name: ext.displayName,
                        blocks,
                        menus,
                        color1: ext.colors.block as HexColorString,
                        color2: ext.colors.inputer as HexColorString,
                        color3: ext.colors.menu as HexColorString
                    };
                }
            };
            ext.blocks.forEach(block => {
                function _processArg(arg: Record<string, any>) {
                    argList.forEach(e => {
                        if (e && e.loader) {
                            if (e.loader.format && !e.loader.format.test(arg[e.name])) {
                                console.error(`Invalid arg input: ${arg[e.name]}`);
                                arg[e.name] = e.loader.defaultValue ?? null;
                                return;
                            };
                            try {
                                arg[e.name] = e.loader.load(arg[e.name]);
                            } catch (err) {
                                console.error(`Error while loading arg: ${e}`);
                                console.error(err);
                                arg[e.name] = e.loader.defaultValue ?? null;
                            };
                        };
                    });
                };
                const argList = block.arguments.map(arg => {
                    return AcceptedInputType.includes(arg.inputType)
                        ? undefined
                        : {
                            name: arg.content,
                            loader: Object.keys(ext.loaders).includes(arg.inputType) ? ext.loaders[arg.inputType] : undefined
                        };
                }).filter(Boolean);
                argList.forEach(arg => {
                    if (arg && !arg.loader) {
                        throw new MissingError(`Cannot find valid arg loader: ${arg.name}`);
                    };
                });
                if (Unnecessary.isAsyncFunction(block.method)) {
                    result[block.opcode] = async (arg: Record<string, any>) => {
                        _processArg(arg);
                        return JSON.stringify(await block.method.call(ext, arg));
                    };
                } else {
                    result[block.opcode] = (arg: Record<string, any>) => {
                        _processArg(arg);
                        return JSON.stringify(block.method.call(ext, arg));
                    };
                };
            });
            ext.generated = result;
            return result;
        };
        return ExtensionConstructor as any;
    }
    export const config: Record<string, any> = {
        loader: loaderConfig,
        server: serverConfig
    };
    export function isInWaterBoxed() {
        return window.ScratchWaterBoxed !== undefined;
    }
    export function getScratch(): Scratch | ScratchWaterBoxed | undefined {
        if (window.ScratchWaterBoxed) return window.ScratchWaterBoxed;
        if (window.Scratch) return window.Scratch;
        return;
    }
    export function getFSContext(): GlobalResourceMachine {
        return window._FSContext as GlobalResourceMachine;
    }
    export async function load(extension: typeof Extension) {
        const constructorPlain = extension;
        const constructorGenerated = await generateConstructor(extension);
        const objectPlain = extension.onlyInstance;
        const objectGenerated = new constructorGenerated(getScratch());
        const scratch = getScratch() as ScratchWaterBoxed;
        return {
            objectPlain,
            objectGenerated,
            constructors: {
                plain: constructorPlain,
                generated: constructorGenerated
            },
            to(...platforms: PlatformSupported[]) {
                for (const platform of platforms) {
                    console.log(`Trying to load FSExtension "${objectPlain.id}" on platform "${platform}"...`);
                    if (platform === "TurboWarp") {
                        scratch.extensions.register(objectGenerated);
                    } else if (platform === "GandiIDE") {
                        window.tempExt = {
                            Extension: constructorGenerated,
                            info: {
                                extensionId: objectPlain.id,
                                name: objectPlain.displayName,
                                description: objectPlain.description,
                                featured: true,
                                disabled: false,
                                collaboratorList: objectPlain.collaborators
                            }
                        };
                    } else {
                        throw new UncognizedError(`Unknown platform "${platform}"`);
                    };
                    if (isInWaterBoxed()) {
                        scratch.currentExtension = objectGenerated;
                        scratch.currentExtensionPlain = objectPlain;
                    };
                    getFSContext().EXTENSIONS[objectPlain.id] = objectPlain.version;
                }
                return this;
            },
            debugPrint() {
                console.log("plainObject:");
                console.dir(objectPlain);
                console.log("generatedObject:");
                console.dir(objectGenerated);
                console.log("info:");
                console.dir(objectGenerated.getInfo());
                return this;
            }
        };
    }
}