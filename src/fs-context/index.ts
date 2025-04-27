import { getDynamicArgs, initExpandableBlocks } from "./dynamicArg";
import { initOverloadedBlocks } from "./overloadedBlock";
import { ExtensionLoadError, GeneratedFailed, MissingError, UncognizedError } from "./exceptions";
import type {
    ArgumentPlain,
    BlockPlain,
    DynamicArgConfigPlain,
    ExtensionInfo,
    ExtensionPlain,
    HexColorString,
    MenuPlain,
    PlatformSupported,
    Scratch,
    ScratchWaterBoxed
} from "./internal";
import { AcceptedInputType } from "./internal";
import type { Extension } from "./structs";
import { Menu } from "./structs";
import "./styles/common.css";
import { Cast } from "./tools";
export namespace Extensions {
    function generateConstructor(extension: typeof Extension): new (runtime?: Scratch) => ExtensionPlain {
        const ext = extension.onlyInstance;
        function ExtensionConstructor(this: ExtensionPlain, runtime?: Scratch): ExtensionPlain {
            if (!runtime?.extensions?.unsandboxed && !ext.allowSandboxed) {
                throw new ExtensionLoadError(`FSExtension "${ext.id}" must be supported unsandboxed.`);
            };
            const runtimeAssigned = Object.assign({},
                window.ScratchWaterBoxed ?? window.Scratch ?? {},
                runtime?.vm?.runtime ?? {},
                { runtime });
            ext.runtime = runtimeAssigned;
            if (!ext.allowSandboxed) {
                ext.canvas = runtime?.renderer.canvas;
            };
            ext.init(runtimeAssigned);
            ext.blocks.forEach(block => {
                block.parts.forEach(arg => {
                    if (arg.inputType === "menu" && arg.value instanceof Menu) {
                        ext.menus.push(arg.value);
                        arg.value = arg.value.name;
                    }
                });
            });
            const blocks: ExtensionInfo["blocks"] = [];
            for (const block of ext.blocks) {
                if (block.type === "separator") {
                    blocks.push("---");
                }
                let haveRest = false;
                const args: Record<string, ArgumentPlain> = {};
                const currentBlock: BlockPlain = {
                    opcode: block.opcode,
                    blockType: block.type,
                    text: block.text,
                    arguments: args,
                    hideFromPalette: block.hidden,
                    disableMonitor: !block.monitor,
                    shouldRestartExistingThreads: block.restartable,
                    filter: block.platform,
                    isEdgeActivated: block.edge
                };
                if (block.overloads.length > 0) {
                    currentBlock.overloads = block.overloadedText;
                };
                for (const argIndex in block.plainArguments) {
                    const arg = block.plainArguments[argIndex];
                    const argIndexNumber = Number(argIndex);
                    const partIndexNumber = block.parts.findIndex(e => e === arg);
                    const lastArg = block.plainArguments[argIndexNumber - 1];
                    const nextArg = block.plainArguments[argIndexNumber + 1];
                    const lastPart = block.parts[partIndexNumber - 1];
                    const nextPart = block.parts[partIndexNumber + 1];
                    const amIRest = !!arg.dyConfig;
                    const myRestConfig: DynamicArgConfigPlain = {
                        afterArg: argIndex === "0" ? undefined : lastArg.content,
                        dynamicArgTypes: [],
                        preText: lastPart?.content ?? "",
                        endText: nextPart?.content ?? "",
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
                        type: Cast.castInputType(arg.inputType),
                    };
                    if (!AcceptedInputType.includes(arg.inputType)) {
                        if (Object.keys(ext.loadersWithDefault).includes(arg.inputType)) {
                            currentArg.type = "string";
                        };
                    };
                    if (arg.inputType === "menu") {
                        currentArg.menu = (arg.value || arg.content) as string;
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
                runtime: ext.runtime
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
                result[block.opcode] = (arg: Record<string, any>) => {
                    _processArg(arg);
                    const { $overloadIndex } = arg;
                    if ($overloadIndex !== undefined) delete arg.$overloadIndex;
                    const result = block.method.call(ext, arg, $overloadIndex ?? 0);
                    if (result instanceof Promise) {
                        return result.then((result) => {
                            return typeof result === "string" ? result : JSON.stringify(result);
                        }).catch(err => { throw err; });
                    } else {
                        return typeof result === "string" ? result : JSON.stringify(result);
                    };
                };
            });
            ext.generated = result;
            if (!ext.disableBlockInjection) {
                if (!isInWaterBoxed()) initExpandableBlocks(result);
                if (!isInWaterBoxed()) initOverloadedBlocks(result);
            };
            return result;
        };
        return ExtensionConstructor as any;
    }
    export function isInWaterBoxed(data?: typeof window.ScratchWaterBoxed): data is ScratchWaterBoxed {
        return !!window.ScratchWaterBoxed;
    }
    export function getScratch(): Scratch | ScratchWaterBoxed | undefined {
        if (window.ScratchWaterBoxed) return window.ScratchWaterBoxed;
        if (window.Scratch) return window.Scratch;
        return;
    }
    export function load(extension: typeof Extension) {
        const constructorPlain = extension;
        const constructorGenerated = generateConstructor(extension);
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