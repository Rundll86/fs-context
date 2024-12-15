import { Extensions } from ".";
import {
    ArgumentDefine,
    ArgumentPart,
    BlockTypePlain,
    ColorDefine,
    MenuItem,
    TranslatorStoredData,
    LanguageSupported,
    LanguageStored,
    BlockConfigB,
    ExtractField,
    Scratch,
    ObjectInclude,
    VersionString,
    BlockConfigA,
    MenuDefine
} from "./internal";
import { MenuParser, TextParser, Unnecessary } from "./tools";
import { MissingError, OnlyInstanceWarn } from "./exceptions";
export class Extension {
    id: string = "example-extension";
    displayName: string = "Example extension";
    version: Version = new Version("1.0.0");
    allowSandboxed: boolean = true;
    requires: ObjectInclude<Version> = {};
    blocks: Block<this & any>[] = [];
    menus: Menu[] = [];
    description: string = "An example extension";
    collaborators: Collaborator[] = [];
    autoDeriveColors: boolean = true;
    colors: ColorDefine = {
        theme: "#FF0000"
    };
    runtime?: Scratch;
    canvas?: HTMLCanvasElement;
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
                this.colors.block = Unnecessary.darken(this.colors.theme, 0);
                this.colors.inputer = Unnecessary.darken(this.colors.theme, 0.15);
                this.colors.menu = Unnecessary.darken(this.colors.theme, 0.3);
            } else {
                throw new MissingError(`FSExtension "${this.id}" can auto derive colors but have no theme color.`);
            };
        };
        return this.colors;
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
    method: (this: O, args: any) => any = () => { };
    arguments: ArgumentPart[] = [];
    type: BlockTypePlain = "command";
    private _opcode: string = "";
    get opcode(): string {
        return this._opcode;
    }
    get text(): string {
        let result: string = "";
        for (const arg of this.arguments) {
            if (arg.type === "text") {
                result += arg.content;
            } else {
                result += `[${arg.content}]`;
            }
        }
        return result;
    }
    static create<O extends Extension, T extends BlockConfigB<ArgumentDefine[]>>(
        text: string,
        config: T,
        method?: (this: O, arg: T extends BlockConfigB<infer R> ? ExtractField<R> : never) => any
    ): Block<O> {
        const realConfig: BlockConfigB<ArgumentDefine[]> = { arguments: config.arguments || [], ...config };
        const _arguments = realConfig.arguments as ArgumentDefine[];
        const realMethod = method || (() => { }) as any;
        const textLoaded: (string | ArgumentDefine)[] = [];
        const messages = Unnecessary.splitTextPart(text, _arguments.map(i => i.name));
        const args = Unnecessary.splitArgBoxPart(text, _arguments.map(i => i.name));
        for (let i = 0; i < messages.length; i++) {
            textLoaded.push(messages[i].replaceAll("[", "[").replaceAll("]", "]"));
            const current = _arguments.find(e => e.name === args[i]) as ArgumentDefine;
            if (current) {
                textLoaded.push(current);
            };
        };
        return new Block<O>({
            method: realMethod,
            type: realConfig.type,
            opcode: method?.name || Unnecessary.internalUUID.next()
        }, ...textLoaded);
    }
    constructor(config?: BlockConfigA<[]>, ...args: any[]) {
        for (let i = 0; i < args.length; i++) {
            let currentPart: ArgumentPart;
            if (typeof args[i] === "string") {
                currentPart = new ArgumentPart(args[i] as string, "text");
            } else {
                const currentArgument: ArgumentDefine = args[i] as ArgumentDefine;
                currentPart = new ArgumentPart(
                    currentArgument.name,
                    "input",
                    currentArgument.value,
                    currentArgument.inputType
                );
            }
            this.arguments.push(currentPart);
        };
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
    language: LanguageSupported = Extensions.getScratch()?.translate.language || 'zh-cn';
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
export class DataStorer<T extends { [key: string]: any } = any> {
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
}
export namespace BlockType {
    export function Plain(type: BlockTypePlain, text: string) {
        return function (target: Extension, propertyKey: string, descriptor: PropertyDescriptor) {
            const block = new Block({
                opcode: propertyKey,
                type,
                method: descriptor.value
            });
            const parent: typeof Extension = target.constructor as typeof Extension;
            block.arguments = TextParser.parsePart(text);
            parent.blockDecorated.push(block);
        };
    }
    export function Command(text: string) {
        return Plain("command", text);
    }
    export function Reporter(text: string) {
        return Plain("reporter", text);
    }
}