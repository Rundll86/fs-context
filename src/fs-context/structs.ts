import type {
    ArgumentDefine,
    BlockTypePlain,
    ColorDefine,
    MenuItem,
    TranslatorStoredData,
    LanguageSupported,
    LanguageStored,
    BlockConfigB,
    ExtractField,
    Scratch,
    VersionString,
    BlockConfigA,
    MenuDefine,
    InputLoader,
    ExtensionPlain,
    CopyAsGenericsOfArray,
    BlocklyType,
    ExtensionInfo,
    BlockPlain
} from "./internal";
import { ArgumentPart } from "./internal";
import { Color, MenuParser, OriginalState, TextParser } from "./tools";
import { GeneratedFailed, InjectionError, MissingError, OnlyInstanceWarn } from "./exceptions";
import md5 from "md5";
import type { Block as BlocklyBlock } from "blockly";
export class Extension {
    id: string = "example-extension";
    displayName: string = "Example extension";
    version: Version = new Version("1.0.0");
    allowSandboxed: boolean = true;
    requires: Record<string, Version> = {};
    blocks: Block<any>[] = [];
    menus: Menu[] = [];
    description: string = "An example extension";
    collaborators: Collaborator[] = [];
    autoDeriveColors: boolean = true;
    colors: ColorDefine = {
        theme: "#FF0000"
    };
    runtime?: Scratch;
    canvas?: HTMLCanvasElement;
    loaders: Record<string, InputLoader> = {};
    generated?: ExtensionPlain;
    get loadersWithDefault(): Record<string, InputLoader> {
        return {
            ...this.loaders,
            string: {
                load: String
            },
            number: {
                load: Number
            },
            bool: {
                load: Boolean
            }
        };
    }
    private static instance?: Extension;
    static get onlyInstance(): Extension {
        if (!this.instance) {
            this.instance = new this(true);
            this.instance.blocks.push(...this.blockDecorated);
        };
        return this.instance;
    };
    static blockDecorated: Block[] = [];
    calcColor() {
        if (this.autoDeriveColors) {
            if (this.colors.theme) {
                this.colors.block = Color.darken(this.colors.theme, 0);
                this.colors.inputer = Color.darken(this.colors.theme, 0.15);
                this.colors.menu = Color.darken(this.colors.theme, 0.3);
            } else {
                throw new MissingError(`FSExtension "${this.id}" can auto derive colors but have no theme color.`);
            };
        };
        return this.colors as Required<ColorDefine>;
    };
    callLoader(name: string[], src: string): any {
        const loader = this.loaders[name[0]];
        if (loader) {
            return loader.load(src);
        } else {
            throw new MissingError(`Loader "${name[0]}" is not found.`);
        };
    };
    callBlock(opcode: string, arg: Record<string, any>) {
        if (this.generated) {
            const block = this.generated.getInfo().blocks.find(i => i.opcode === opcode);
            if (block) {
                this.generated[block.opcode].call(this, arg);
            } else {
                throw new MissingError(`Block "${opcode}" is not found.`);
            };
        } else {
            throw new MissingError("Extension is not generated or constructed.");
        };
    };
    init(runtime?: Scratch): any {
        this.runtime = runtime;
    };
    constructor(ignoreError: boolean = false) {
        if (!ignoreError) {
            throw new OnlyInstanceWarn("Extension can not be instantiated directly.");
        };
    };
}
export class Block<O extends Extension = Extension> {
    method: (this: O, args: any, overloadIndex: number) => any = () => { };
    parts: ArgumentPart[] = [];
    overloads: ArgumentPart[][] = [];
    type: BlockTypePlain = "command";
    hidden: boolean = false;
    monitor: boolean = false;
    platform: BlockMode.TargetType[] = ["sprite", "stage"];
    restartable: boolean = false;
    edge: boolean = false;
    private _opcode: string = "";
    get opcode(): string {
        return this._opcode || md5(this.text || this.overloadedText[0]);
    }
    get text(): string {
        let result: string = "";
        for (const arg of this.parts) {
            if (arg.type === "text") {
                result += arg.content;
            } else if (!arg.dyConfig) {
                result += `[${arg.content}]`;
            }
        }
        return result;
    }
    get overloadedText(): string[] {
        const results: string[] = [];
        for (const overload of this.overloads) {
            let result: string = "";
            for (const arg of overload) {
                if (arg.type === "text") {
                    result += arg.content;
                } else if (!arg.dyConfig) {
                    result += `[${arg.content}:${arg.inputType}=${arg.value}]`;
                }
            }
            results.push(result);
        }
        return results;
    }
    get haveRestArg() {
        return !!this.parts.find(i => i.dyConfig);
    }
    get plainArguments() {
        return this.parts.filter(i => i.type === "input");
    }
    get textArguments() {
        return this.parts.filter(i => i.type === "text");
    }
    static create<O extends Extension, T extends BlockConfigB<ArgumentDefine[]>>(
        text: CopyAsGenericsOfArray<string>,
        config: T,
        method?: (
            this: O,
            args: T extends BlockConfigB<infer R> ? ExtractField<R> & Record<string, any> : never,
            overloadIndex: number
        ) => any
    ): Block<O> {
        const realConfig: BlockConfigB<ArgumentDefine[]> = { arguments: config.arguments || [], ...config };
        const argumentTypeOverrides = realConfig.arguments ?? [];
        const realMethod = method || (() => { }) as any;
        const result = new Block<O>({
            method: realMethod,
            type: realConfig.type,
            opcode: method?.name
        });
        if (Array.isArray(text)) {
            result.overloads = text.map(i => TextParser.parsePart(i));
        } else {
            result.parts = TextParser.parsePart(text).map(e => {
                const currentOverride = argumentTypeOverrides.find(i => i.name === e.content);
                if (e.type === "input" && currentOverride && currentOverride.inputType) {
                    e.inputType = currentOverride.inputType;
                };
                return e;
            });
        };
        return result;
    }
    constructor(config?: BlockConfigA<[]>) {
        if (config) {
            const data = config;
            if (data.method) {
                this.method = data.method;
            };
            if (data.type) {
                this.type = data.type;
            };
            if (data.opcode) {
                this._opcode = data.opcode;
            };
        };
    };
}
export class Collaborator {
    name?: string;
    url?: string;
    constructor(name?: string, url?: string) {
        this.name = name;
        this.url = url;
    }
}
export class Menu {
    acceptReporters: boolean = true;
    items: MenuItem[] = [];
    name: string;
    constructor(name: string, items?: MenuDefine, acceptReporters?: boolean) {
        this.name = name;
        if (acceptReporters !== undefined) {
            this.acceptReporters = acceptReporters;
        };
        if (items !== undefined) {
            this.items = MenuParser.normalize(items);
        };
    }
}
export class Translator<L extends LanguageSupported, D extends LanguageStored> {
    private stored: TranslatorStoredData = {};
    language: LanguageSupported = (window.Scratch ?? window.ScratchWaterBoxed)?.translate.language || 'zh-cn';
    defaultLanguage: L = 'zh-cn' as L;
    store<T extends LanguageSupported>(lang: T, data: D & LanguageStored) {
        this.stored[lang] = data;
    }
    load(keyword: keyof D): string {
        const currentStore = this.stored[this.language] as D;
        if (currentStore) {
            return currentStore[keyword] || this.unTranslatedText(keyword);
        } else {
            return this.unTranslatedText(keyword);
        };
    }
    unTranslatedText(keyword: keyof D) {
        const currentStore = this.stored[this.defaultLanguage] as D;
        return currentStore[keyword];
    }
    static create<T extends LanguageSupported, D extends LanguageStored>(lang: T, store: D): Translator<T, D> {
        const result = new Translator<T, D>();
        result.defaultLanguage = lang;
        result.store(lang, store);
        return result;
    }
}
export class DataStorer<T = any> {
    private data: T;
    constructor(data: T) {
        this.data = data;
    }
    read<K extends keyof T>(key: K): T[K] {
        return this.data[key];
    }
    write<K extends keyof T>(key: K, value: T[K] extends (infer R)[] ? R : T[K]) {
        if (Array.isArray(this.data[key])) {
            this.data[key].push(value);
        }
        else this.data[key] = value as T[K];
    }
    clear<K extends keyof T>(key: K) {
        if (Array.isArray(this.data[key])) {
            this.data[key] = [] as T[K];
        }
        else delete this.data[key];
    }
}
export class Version {
    major: number = 1;
    minor: number = 0;
    patch: number = 0;
    constructor(version: VersionString)
    constructor(major: number, minor: number, patch: number)
    constructor(a: number | string = 1, b: number = 0, c: number = 0) {
        if (typeof a === "string") {
            const parts = a.split(".");
            this.major = parseInt(parts[0]);
            this.minor = parseInt(parts[1]);
            this.patch = parseInt(parts[2]);
        } else {
            this.major = a;
            this.minor = b;
            this.patch = c;
        }
    }
    toString(prefix: string = "v") {
        return `${prefix}${this.major}.${this.minor}.${this.patch}`;
    }
    static compare(a: Version, b: Version): Version {
        if (a.major > b.major) return a;
        if (a.major < b.major) return b;
        if (a.minor > b.minor) return a;
        if (a.minor < b.minor) return b;
        if (a.patch > b.patch) return a;
        if (a.patch < b.patch) return b;
        return a;
    }
};
export abstract class BlocklyInjector {
    private extension: ExtensionPlain;
    private runtime: Scratch;
    private blockly: BlocklyType;
    private get availableBlocks(): BlockPlain[] {
        return this.extension.getInfo().blocks?.filter(this.isAvailableBlock) ?? [];
    }
    public constructor(extension: ExtensionPlain) {
        if (!extension)
            throw new InjectionError("no extension given.");
        if (!extension.runtime)
            throw new InjectionError(`no runtime found in ${extension.getInfo().id}.`);
        this.runtime = extension.runtime;
        this.extension = extension;
        const blockly = OriginalState.getBlockly(this.runtime);
        if (!blockly)
            throw new InjectionError("failed to get blockly instance.");
        this.blockly = blockly;
    }
    public isAvailableBlock(blockInfo: BlockPlain): boolean {
        return !!blockInfo.opcode;
    }
    public configMap(originBlock: BlockPlain): BlockPlain {
        originBlock.text += "123456";
        return originBlock;
    }
    public getInfo(originInfo: ExtensionInfo) {
        return originInfo;
    }
    public inject(block: BlocklyBlock, myInfo: BlockPlain): void {
        Object.assign({}, block, { opcode: myInfo.opcode });
    }
    public init(block: BlocklyBlock, myInfo: BlockPlain): void {
        block.appendDummyInput("endText").appendField(`(Block injected: ${myInfo.opcode})`);
    }
    private findAvaliable(opcodeWithExtensionID: string): BlockPlain | null {
        return this.availableBlocks.find(
            block =>
                opcodeWithExtensionID === `${this.extension.getInfo().id}_${block.opcode}`
        ) ?? null;
    }
    private isDefinitionAvailable(opcodeWithExtensionID: string): boolean {
        return this.availableBlocks.length > 0 && this.availableBlocks.some(block => opcodeWithExtensionID === `${this.extension.getInfo().id}_${block.opcode}`);
    }
    public start() {
        if (!this.blockly) return;
        const originGetInfo = this.extension.getInfo.bind(this.extension);
        this.extension.getInfo = () => {
            const originInfo = originGetInfo();
            originInfo.blocks = originInfo.blocks?.map(
                block => this.isAvailableBlock(block) ? this.configMap(block) : block
            ) ?? [];
            return this.getInfo(originInfo) ?? originInfo;
        };
        this.blockly.Blocks = new Proxy(this.blockly.Blocks, {
            set: (target, opcode: string, definition: BlocklyBlock) => {
                const injected = definition;
                if (this.isDefinitionAvailable(opcode)) {
                    const originInit = injected.init;
                    // eslint-disable-next-line @typescript-eslint/no-this-alias
                    const injector = this;
                    injected.init = function (this: BlocklyBlock) {
                        originInit?.call(this);
                        injector.init(this, injector.findAvaliable(opcode) as BlockPlain);
                        injector.inject(this, injector.findAvaliable(opcode) as BlockPlain);
                    };
                };
                return Reflect.set(target, opcode, injected);
            }
        });
    }
}
export namespace BlockMode {
    function matchBlock(target: Extension, key: string, descriptor: PropertyDescriptor) {
        const parent = OriginalState.getConstructor<typeof Extension>(target);
        const myself = parent.blockDecorated[parent.blockDecorated.length - 1];
        if (myself) {
            if (key === myself.opcode) {
                return myself;
            } else {
                throw new GeneratedFailed(`Cannot match ${key} in ${target.id}, unmatched opcode.`);
            };
        } else
            throw new GeneratedFailed(`Cannot match ${key} in ${target.id}, block instance isn't found.`);
    }
    export type TargetType = "sprite" | "stage";
    export function Hidden(target: Extension, propertyKey: string, descriptor: PropertyDescriptor) {
        const myself = matchBlock(target, propertyKey, descriptor);
        myself.hidden = true;
    }
    export function UseMonitor(target: Extension, propertyKey: string, descriptor: PropertyDescriptor) {
        const myself = matchBlock(target, propertyKey, descriptor);
        if (!["reporter", "bool"].includes(myself.type))
            throw new GeneratedFailed(`Monitor can only be used in reporter block.`);
        myself.monitor = true;
    }
    export function Filt(...platform: TargetType[]) {
        return function (target: Extension, propertyKey: string, descriptor: PropertyDescriptor) {
            const myself = matchBlock(target, propertyKey, descriptor);
            myself.platform = platform;
        };
    }
    export function ThreadRestartable(target: Extension, propertyKey: string, descriptor: PropertyDescriptor) {
        const myself = matchBlock(target, propertyKey, descriptor);
        if (!["hat", "event"].includes(myself.type))
            throw new GeneratedFailed(`ThreadRestartable can only be used in hat or event block.`);
        myself.restartable = true;
    }
    export function ActiveEdge(target: Extension, propertyKey: string, descriptor: PropertyDescriptor) {
        const myself = matchBlock(target, propertyKey, descriptor);
        if (!["hat"].includes(myself.type))
            throw new GeneratedFailed(`ActiveEdge can only be used in hat block.`);
        myself.edge = true;
    }
}
export namespace BlockType {
    export function Plain(type: BlockTypePlain, text: string | string[]) {
        return function (target: Extension, propertyKey: string, descriptor: PropertyDescriptor) {
            const block = new Block({
                opcode: propertyKey,
                type,
                method: descriptor.value
            });
            const parent = OriginalState.getConstructor<typeof Extension>(target);
            if (Array.isArray(text)) {
                block.overloads = text.map(e => TextParser.parsePart(e));
            } else block.parts = TextParser.parsePart(text);
            parent.blockDecorated.push(block);
        };
    }
    export function Command(text: string | string[]) {
        return Plain("command", text);
    }
    export function Reporter(text: string | string[]) {
        return Plain("reporter", text);
    }
    export function Boolean(text: string | string[]) {
        return Plain("Boolean", text);
    }
    export function Hat(text: string | string[]) {
        return Plain("hat", text);
    }
    export function Label(text: string | string[]) {
        return Plain("label", text);
    }
}