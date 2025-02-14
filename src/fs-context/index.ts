import { getDynamicArgs, initExpandableBlocks } from "./dynamicArg";
import { ExtensionLoadError, GeneratedFailed, MissingError, UncognizedError } from "./exceptions";
import {
    ArgumentPlain,
    BlockPlain,
    DynamicArgConfigPlain,
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
            if (!ext.allowSandboxed) {
                ext.canvas = runtime?.renderer.canvas;
            };
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
                let haveRest = false;
                const args: Record<string, ArgumentPlain> = {};
                const currentBlock: BlockPlain = {
                    opcode: block.opcode,
                    blockType: block.type,
                    text: block.text,
                    arguments: args
                };
                for (const argIndex in block.plainArguments) {
                    const arg = block.plainArguments[argIndex];
                    const amIRest = !!arg.dyConfig;
                    const myRestConfig: DynamicArgConfigPlain = {
                        afterArg: argIndex === "0" ? undefined : block.plainArguments[Number(argIndex) - 1].content,
                        dynamicArgTypes: [],
                        ...arg.dyConfig ?? {}
                    };
                    if (arg.dyConfig) {
                        if (haveRest) {
                            throw new GeneratedFailed("Block can have only one rest argument.");
                        } else {
                            haveRest = true;
                            if (
                                Object.keys(ext.loadersWithDefault).includes(arg.inputType)
                            ) {
                                (myRestConfig.dynamicArgTypes as AcceptedInputType[]).push(
                                    (Object.keys(ext.loadersWithDefault).includes(arg.inputType) ? "string" : arg.inputType) as AcceptedInputType
                                );
                            } else {
                                throw new GeneratedFailed("Rest argument must be string, number, bool or any loader.");
                            }
                        }
                    };
                    const currentArg: ArgumentPlain = {
                        type: Unnecessary.castInputType(arg.inputType),
                    };
                    if (!AcceptedInputType.includes(arg.inputType)) {
                        if (Object.keys(ext.loadersWithDefault).includes(arg.inputType)) {
                            currentArg.type = "string";
                        };
                    };
                    if (arg.inputType === "menu") {
                        currentArg.menu = arg.value as string;
                    } else {
                        currentArg.defaultValue = arg.value;
                    };
                    if (amIRest) {
                        currentBlock.dynamicArgsInfo = myRestConfig;
                    };
                    args[arg.content] = currentArg;
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
                },
                runtime
            };
            ext.blocks.forEach(block => {
                function _processArg(arg: Record<string, any>) {
                    function _useLoader(e: typeof argList[number], arg: Record<string, any>) {
                        if (e?.loader) {
                            if (e.loader.format && !e.loader.format.test(arg[e.name])) {
                                console.error(`Invalid arg input: ${arg[e.name]}`);
                                return e.loader.defaultValue ?? null;
                            };
                            try {
                                return e.loader.load(arg[e.name]);
                            } catch (err) {
                                console.error(`Error while loading ${e.isRest ? 'dynamic' : 'static'} arg: ${e}`);
                                console.error(err);
                                return e.loader.defaultValue ?? null;
                            };
                        };
                    };
                    let dyArgs: string[] = [];
                    if (block.haveRestArg) {
                        dyArgs = getDynamicArgs(arg);
                    };
                    argList.forEach(e => {
                        if (e) {
                            if (e.isRest) {
                                arg[e.name] = dyArgs.map((_, index) => {
                                    delete arg[`DYNAMIC_ARGS${index}`];
                                    if (index === dyArgs.length - 1) {
                                        delete arg[`DYNAMIC_ARGS${index + 1}`];
                                    };
                                    return _useLoader({ ...e, name: String(index) }, dyArgs);
                                });
                            } else {
                                arg[e.name] = _useLoader(e, arg);
                            }
                        };
                    });
                };
                const argList = block.plainArguments.map(arg => {
                    let needLoad = false;
                    if (!AcceptedInputType.includes(arg.inputType)) { //不属于已知输入类型，需要loader
                        needLoad = true;
                    } else if (arg.dyConfig) { //是动态参数，需要loader
                        needLoad = true;
                    };
                    if (needLoad) return {
                        name: arg.content as string,
                        loader: Object.keys(ext.loadersWithDefault).includes(arg.inputType) ? ext.loadersWithDefault[arg.inputType] : undefined,
                        isRest: !!arg.dyConfig
                    }; else return undefined;
                }).filter(Boolean);
                argList.forEach(arg => {
                    if (arg && !arg.loader /*没有找到匹配的loader*/) {
                        throw new MissingError(`Cannot find valid arg loader of arg ${arg.name}`);
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
            if (!isInWaterBoxed()) initExpandableBlocks(result);
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