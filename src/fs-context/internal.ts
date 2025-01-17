import type { Block, DataStorer, Extension, Menu, Version } from "./structs";
import type Blockly from "blockly";
export class ArgumentPart {
    content: string;
    type: ArgumentPartType;
    value: AcceptedArgType = "";
    inputType: InputType = "string";
    dyConfig?: DynamicArgConfigDefine;
    constructor(content: string, type: ArgumentPartType, value?: AcceptedArgType, inputType?: InputType, dyConfig?: DynamicArgConfigDefine) {
        this.content = content;
        this.type = type;
        console.log(content, inputType);
        if (value) this.value = value;
        if (inputType) this.inputType = inputType;
        this.dyConfig = dyConfig;
    }
}
export interface ArgumentDefine<T extends ValidArgumentName = ValidArgumentName> {
    name: T;
    value?: AcceptedArgType;
    inputType?: InputType | string;
    rest?: DynamicArgConfigDefine;
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
export const InputTypeCastConstructor: Record<string, any> = {
    string: String,
    number: Number,
    bool: Boolean,
    menu: String,
    angle: Number,
    color: String,
    "hat-paramater": String,
};
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
    dynamicArgsInfo?: DynamicArgConfigPlain;
}
export type ExtensionPlain = {
    getInfo: () => ExtensionInfo;
    runtime?: Scratch;
} & {
    [key: string]: any;
    [key: symbol]: any;
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
export enum InputTypeOptionsLabel {
    string = "ADD_TEXT_PARAMETER",
    number = "ADD_NUM_PARAMETER",
    bool = "ADD_BOOL_PARAMETER",
};
export type AcceptedInputType = keyof typeof InputTypeOptionsLabel;
export type BlocklyType = typeof Blockly & {
    ScratchMsgs: {
        locales: Record<string, Record<string, string>>;
        translate: (key: string) => string;
    };
    bindEventWithChecks_: <T extends keyof HTMLElementEventMap>(
        a: SVGElement | null,
        b: T,
        c: Blockly.FieldImage,
        d: (event: HTMLElementEventMap[T]) => any
    ) => void;
};
export type SourceBlockTypeButScratch = Blockly.Block & {
    addDynamicArg: (id: AcceptedInputType) => void;
    removeDynamicArg: (id: string) => void
    dynamicArgOptionalTypes_: (AcceptedInputType)[];
    dynamicArgumentIds_: string[];
    workspace: Blockly.Workspace & {
        isDragging: () => boolean;
    };
};
export type AllFunction = (...args: any[]) => any;
export interface DynamicArgConfigPlainAllRequired {
    defaultValues: CopyAsGenericsOfArray<string> | ((index: number) => string);
    afterArg: string; //Ban in define
    joinCh: string | ((index: number) => string);
    dynamicArgTypes: AcceptedInputType[]; //Ban in define
    preText: string | ((count: number) => string);
    endText: string | ((count: number) => string);
    paramsIncrement: CopyAsGenericsOfArray<number>;
};
export type DynamicArgConfigPlain = {
    [K in keyof DynamicArgConfigPlainAllRequired]?: DynamicArgConfigPlainAllRequired[K];
};
export type DynamicArgConfigDefine = {
    [K in keyof DynamicArgConfigPlain as K extends "afterArg" | "dynamicArgTypes" ? never : K]:
    DynamicArgConfigPlain[K];
};