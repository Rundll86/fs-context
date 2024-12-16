import { ExtensionLoadError, UncognizedError } from "./exceptions";
import { ArgumentPlain, BlockPlain, ExtensionPlain, GlobalResourceMachine, HexColorString, LoaderConfig, MenuPlain, ObjectInclude, PlatformSupported, Scratch, ScratchWaterBoxed } from "./internal";
import loaderConfig from "@config/loader";
import type { Extension } from "./structs";
if (!window._FSContext) {
    // 这个判断有点史，优化下
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
                throw new ExtensionLoadError(`FSExtension "${ext.id}" must be supported unsandboxed.`)
            };
            for (const i in ext.requires) {
                if (!Object.keys(context.EXTENSIONS).includes(i)) {
                    throw new ExtensionLoadError(`FSExtension "${ext.id}" requires ${i} to be loaded.`)
                }
                if (Version.compare(context.EXTENSIONS[i], ext.requires[i]) === ext.requires[i]) {
                    throw new ExtensionLoadError(`FSExtension "${ext.id}" requires ${i} to be at least ${ext.requires[i]}.`)
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
                const args: ObjectInclude<ArgumentPlain> = {};
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
            const menus: ObjectInclude<MenuPlain> = {};
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
                    }
                }
            };
            ext.blocks.forEach(block => {
                result[block.opcode] = Unnecessary.isAsyncFunction(block.method)
                    ? async (arg: ObjectInclude) => JSON.stringify(await block.method.call(ext, arg))
                    : (arg: ObjectInclude) => JSON.stringify(block.method.call(ext, arg));
            });
            return result;
        };
        return ExtensionConstructor as unknown as new (runtime?: Scratch) => ExtensionPlain;
    }
    export const config: ObjectInclude<LoaderConfig, "loader"> = {
        loader: loaderConfig
    }
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
        }
    }
}