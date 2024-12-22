import { Block, DataStorer, Extension, Menu, Version } from "./structs";
export class ArgumentPart {
    content: string;
    type: ArgumentPartType;
    value: AcceptedArgType = "";
    inputType: InputType = "string";
    constructor(content: string, type: ArgumentPartType, value?: AcceptedArgType, inputType?: InputType) {
        this.content = content;
        this.type = type;
        if (value !== undefined) this.value = value;
        if (inputType !== undefined) this.inputType = inputType;
    }
}
export interface ArgumentDefine<T extends ValidArgumentName = ValidArgumentName> {
    name: T;
    value?: AcceptedArgType;
    inputType?: InputType | string;
}
export type ValidArgumentName = `${"$" | "_"}${string}`;
export type MethodFunction<T> = (this: Extension, args: T) => any;
export type Scratch = {
    extensions: {
        register: (target: ExtensionPlain) => void;
        unsandboxed?: boolean;
    } & { [key: string]: any };
    translate: ScratchTranslateFunction;
    renderer: {
        get canvas(): HTMLCanvasElement;
    } & { [key: string]: any };
} & { [key: string]: any };
export interface ScratchWaterBoxed extends Scratch {
    currentExtensionPlain: Extension | null;
    currentExtension: ExtensionPlain | null;
    loadTempExt: () => void;
    currentCatchErrors: string[];
}
export type BlockTypePlain = "command" | "reporter" | "bool";
export type ExtractField<A extends (string | ArgumentDefine)[]> = {
    [K in keyof A as A[K] extends ArgumentDefine<infer R> ? R : never]: any;
}
export interface BlockConfigA<T extends (string | ArgumentDefine)[]> {
    method?: MethodFunction<ExtractField<T>>;
    type?: BlockTypePlain;
    opcode: string;
}
export interface BlockConfigB<T extends ArgumentDefine[]> {
    arguments?: T;
    type?: BlockTypePlain;
}
export interface BlockConfiger<T extends (string | ArgumentDefine)[], O extends Extension> {
    config: (arg: BlockConfigA<T>) => Block<O>;
}
export type HexColorString = `#${string}`;
export interface ColorDefine {
    block?: HexColorString;
    inputer?: HexColorString;
    menu?: HexColorString;
    theme?: HexColorString;
}
export type AcceptedMenuValue = string | number | boolean | object;
export interface MenuItem {
    name: string;
    value: AcceptedMenuValue;
}
export type InputTypeCast = {
    string: string;
    number: number;
    bool: boolean;
    menu: Menu | string;
    angle: number;
    color: HexColorString;
    "hat-paramater": string;
}
export type TranslatorStoredData = {
    [K in LanguageSupported]?: LanguageStored;
}
export type LanguageSupported = "zh-cn" | "en";
export type PlatformSupported = "GandiIDE" | "TurboWarp";
export type LanguageStored = { [key: string]: string; };
export type ArgumentPartType = "text" | "input";
export type InputType = "string" | "number" | "bool" | "menu" | "angle" | "color" | "hat-paramater";
export const AcceptedInputType = ["string", "number", "bool", "menu", "angle", "color", "hat-paramater"];
export const InputTypeCastConstructor = {
    string: String,
    number: Number,
    bool: Boolean,
    menu: String,
    angle: Number,
    color: String,
    "hat-paramater": String,
}
export interface GlobalResourceMachine {
    EXTENSIONS: Record<string, Version>;
    EXPORTED: { [key: string]: DataStorer }
}
export interface ScratchTranslateFunction {
    language: LanguageSupported;
    (key: string): string;
    setup: (data: Record<string, LanguageStored>) => void;
}
export interface StyleSetFunc<E extends HTMLElement> {
    <K extends keyof FilterWritableKeys<CSSStyleDeclaration>>
        (key: K, value: CSSStyleDeclaration[K]): ElementContext<E>;
    <K extends keyof FilterWritableKeys<CSSStyleDeclaration>>
        (key: K): CSSStyleDeclaration[K];
};
export interface AttributeSetFunc<E extends HTMLElement> {
    <K extends keyof FilterWritableKeys<E>>
        (key: K, value: E[K]): ElementContext<E>;
    <K extends keyof FilterWritableKeys<E>>
        (key: K): E[K];
}
export interface DataSetFunc<E extends HTMLElement> {
    (key: string, value: any): ElementContext<E>;
    (key: string): any;
}
export interface ElementContext<T extends HTMLElement = any> {
    result: T;
    store: Record<string, any>;
    child: (target: ElementContext | HTMLElement) => ElementContext<T>;
    class: (...classes: string[]) => ElementContext<T>;
    attribute: AttributeSetFunc<T>;
    style: StyleSetFunc<T>;
    data: DataSetFunc<T>;
}
export type WritableKeys<T> = {
    [K in keyof T]: If<
        Equal<Pick<T, K>, Readonly<Pick<T, K>>>,
        never,
        K
    >;
}[keyof T];
export type FilterWritableKeys<T> = {
    [K in WritableKeys<T>]: T[K];
}
export type If<C extends boolean, T, F> = C extends true ? T : F;
export type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;
// export type ObjectInclude<T = any, K extends string | number | symbol = string> = {
//     [key: string]: T;
// } & {
//     [C in K]: T;
// }
export type VersionString = `${number}.${number}.${number}`;
export type FilterKey<T, K> = {
    [P in keyof T as P extends K ? never : P]: never;
}
export type FilterOut<T, U> = T extends U ? never : T;
export type AcceptedArgType = InputTypeCast[FilterOut<InputType, "">];
export interface LoaderConfig {
    target: Promise<{ default: typeof Extension }>;
    errorCatches: (new () => Error)[];
    platform: PlatformSupported[];
}
export type KeyValueString<T extends string = "="> = `${string}${T}${string}`;
export type CopyAsGenericsOfArray<E> = E | E[];
export type MenuDefine = CopyAsGenericsOfArray<string | KeyValueString | MenuItem | StringArray>;
export type StringArray = KeyValueString<",">;
export type AnyArg = Record<string, any>;
export interface MenuItemPlain {
    text: string;
    value: any;
}
export interface MenuPlain {
    acceptReporters: boolean;
    items: MenuItemPlain[];
}
export interface ArgumentPlain {
    type?: InputType;
    defaultValue?: any;
    menu?: string;
}
export interface BlockPlain {
    opcode: string;
    arguments: Record<string, ArgumentPlain>;
    text: string;
    blockType: BlockTypePlain;
}
export type ExtensionPlain = {
    getInfo: () => ExtensionInfo;
} & {
    [key: string]: MethodFunction<any>;
}
export interface ExtensionInfo {
    id: string;
    name: string;
    blocks: BlockPlain[];
    menus: Record<string, MenuPlain>;
    color1: HexColorString;
    color2: HexColorString;
    color3: HexColorString;
}
export interface InputLoader {
    format?: RegExp;
    defaultValue?: any;
    load: (data: string) => any;
}