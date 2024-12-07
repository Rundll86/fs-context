import md5 from "md5";
import {
    AcceptedInputType,
    ArgumentPart,
    ElementContext,
    GlobalResourceMachine,
    HexColorString,
    InputType,
    KeyValueString,
    MenuDefine,
    MenuItem,
    InputTypeCastConstructor,
    AcceptedMenuValue
} from "./internal";
import { DataStorer, Extension } from "./structs";
export namespace GlobalContext {
    const context: GlobalResourceMachine = window._FSContext as GlobalResourceMachine;
    export function createDataStore<T extends { [key: string]: any }>(forExt: typeof Extension, datas: T): DataStorer<T> {
        const { id } = forExt.onlyInstance;
        if (Object.hasOwn(context.EXPORTED, id)) {
            throw new Error(`Data store for FSExtenion "${id}" is already exists.`);
        }
        context.EXPORTED[id] = new DataStorer<T>(datas);
        return context.EXPORTED[id];
    }
    export function destoryDataStore(id: string) {
        if (Object.hasOwn(context.EXPORTED, id)) {
            delete context.EXPORTED[id];
        } else {
            throw new Error(`Data store "${id}" does not exist.`);
        }
    }
    export function getDataStore<T extends { [key: string]: any } = any>(id: string): DataStorer<T> {
        if (Object.hasOwn(context.EXPORTED, id)) {
            return context.EXPORTED[id] as DataStorer<T>;
        } else {
            throw new Error(`Data store "${id}" does not exist.`);
        }
    }
}
export namespace Unnecessary {
    export function elementTree<T extends keyof HTMLElementTagNameMap>(
        tag: T,
        childs: ElementContext[] = []
    ): ElementContext<HTMLElementTagNameMap[T]> {
        const result = document.createElement(tag);
        childs.forEach(child => result.appendChild(child.result));
        return {
            result,
            store: {},
            child(target) {
                if (target instanceof HTMLElement) {
                    result.appendChild(target);
                } else {
                    result.appendChild(target.result);
                };
                return this;
            },
            class(...classes: string[]) {
                result.classList.add(...classes);
                return this;
            },
            attribute(key, value = undefined) {
                if (value === undefined) {
                    return result[key];
                }
                result[key] = value as any;
                return this;
            },
            style(key, value = undefined) {
                if (value === undefined) {
                    return result.style[key] as any;
                }
                result.style[key] = value as any;
                return this;
            },
            data(key, value = undefined) {
                if (value === undefined) {
                    return this.store[key];
                }
                this.store[key] = value;
                return this;
            }
        };
    }
    export function randomInt(min: number, max: number) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    export function randomFloat(min: number, max: number) {
        return Math.random() * (max - min) + min;
    }
    export function randomString(length: number, chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ') {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    export function randomColor(): HexColorString {
        return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
    }
    export class UUIDAutoscalator {
        private last: number = 1;
        private length: number = 4;
        next(): string {
            const result = [];
            for (let i = 0; i < this.length; i++) {
                this.last++;
                result.push(md5(this.last + i.toString()).slice(0, 5));
            }
            return result.join('-');
        }
        constructor(length: number = 4) {
            this.length = length;
        }
    }
    export function splitArgBoxPart(str: string, substrings: string[]) {
        const filteredSubstrings = [];
        for (let i = 0; i < str.length; i++) {
            for (const substring of substrings) {
                if (str.startsWith(substring, i)) {
                    filteredSubstrings.push(substring);
                    i += substring.length - 1;
                    break;
                }
            }
        }
        return filteredSubstrings;
    }
    export function splitTextPart(str: string, separators: string[]) {
        if (!separators.length) return [str];
        const regex = new RegExp(separators.map(s => s.replaceAll("$", "\\$")).join('|'), 'g');
        const result = str.split(regex);
        return result;
    }
    export function hexToRgb(str: HexColorString): [number, number, number] {
        let hexs: any[] = [];;
        const reg = /^#?[0-9A-Fa-f]{6}$/;
        if (!reg.test(str)) throw new Error('Invalid hex color string');
        str = str.replace('#', '') as HexColorString;
        hexs = str.match(/../g) || [];
        if (hexs.length < 3) throw new Error('Invalid hex color string');
        return [parseInt(hexs[0], 16), parseInt(hexs[1], 16), parseInt(hexs[2], 16)];
    }
    export function darken(color: HexColorString, level: number): HexColorString {
        const rgb = hexToRgb(color);
        for (let i = 0; i < 3; i++) {
            rgb[i] = Math.floor(rgb[i] - (rgb[i] * level))
        }
        return `#${rgb.map((i) => i.toString(16).padStart(2, "0")).join('')}`;
    }
    export function lighten(color: HexColorString, level: number): HexColorString {
        const rgb = hexToRgb(color);
        for (let i = 0; i < 3; i++) {
            rgb[i] = Math.floor(rgb[i] + (255 - rgb[i]) * level)
        }
        return `#${rgb.map((i) => i.toString(16).padStart(2, "0")).join('')}`;
    }
    export function castInputType(inputType: InputType) {
        const inputTypeCastToScratch: any = {
            bool: "Boolean",
            "hat-paramater": "ccw_hat_parameter"
        };
        return Object.hasOwn(inputTypeCastToScratch, inputType) ? inputTypeCastToScratch[inputType] : inputType;
    }
    export function isAsyncFunction(func: (...args: any[]) => any) {
        return func.constructor.name === "AsyncFunction";
    }
}
export namespace MenuParser {
    let stringArraySeparator = ",";
    export function setSeparator(separator: string) {
        stringArraySeparator = separator;
    }
    export function getSeparator() {
        return stringArraySeparator;
    }
    export function trimSpace(item: AcceptedMenuValue) {
        return typeof item === "string" ? item.trim() : item;
    }
    export function trimSpaceMenuItem(item: MenuItem): MenuItem {
        return {
            name: trimSpace(item.name) as string,
            value: trimSpace(item.value)
        };
    }
    export function parseKeyValue(item: string | KeyValueString): MenuItem {
        if (isKeyValueString(item)) {
            const [name, value] = item.split("=");
            return trimSpaceMenuItem({ name, value });
        } else {
            return trimSpaceMenuItem({ name: item, value: item });
        }
    }
    export function splitStringArray(item: string) {
        return item.split(stringArraySeparator).map(trimSpace);
    }
    export function isStringArray(item: MenuDefine) {
        return typeof item === "string" && item.includes(stringArraySeparator);
    }
    export function isKeyValueString(item: MenuDefine) {
        return typeof item === "string" && item.includes("=") && !isStringArray(item);
    }
    export function normalize(items: MenuDefine): MenuItem[] {
        const result: MenuItem[] = [];
        if (typeof items === "string") {
            if (isKeyValueString(items)) {
                result.push(parseKeyValue(items));
            } else if (isStringArray(items)) {
                splitStringArray(items).forEach(item => {
                    result.push(parseKeyValue(item as string));
                });
            } else {
                result.push(parseKeyValue(items));
            };
        } else if (Array.isArray(items)) {
            items.forEach(item => {
                normalize(item).forEach(item => {
                    result.push(item);
                });
            });
        } else {
            result.push(trimSpaceMenuItem(items));
        };
        return result;
    }
}
export namespace TextParser {
    export const regex = /(\[.*?\])|(\$.*?;)/g;
    export function split(target: string): { text: string[], arg: string[] } {
        const arg: string[] = target.match(regex) || [];
        const text: string[] = target.split(regex);
        return {
            text: text.filter(item => item !== undefined).filter((_, index) => index % 2 === 0),
            arg: arg.filter(Boolean).map(item => item.slice(1, -1))
        };
    }
    export function parsePart(text: string): ArgumentPart[] {
        const result: ArgumentPart[] = [];
        const parts = split(text);
        parts.text.forEach((item, index) => {
            if (!item) { return; };
            result.push(new ArgumentPart(item, "text"));
            if (parts.arg.length > index) {
                result.push(new ArgumentPart(
                    parseName(parts.arg[index]),
                    "input",
                    parseDefaultValue(parts.arg[index]),
                    parseType(parts.arg[index])
                ));
            };
        });
        return result;
    }
    export function hasType(arg: string) {
        return arg.includes(":");
    }
    export function hasDefaultValue(arg: string) {
        return arg.includes("=");
    }
    export function parseType(arg: string): InputType {
        if (!hasType(arg)) {
            return "string";
        };
        const splited = arg.split(":");
        splited.shift();
        let result = splited.join(":");
        if (hasDefaultValue(arg)) {
            result = result.split("=", 1)[0];
        };
        if (!AcceptedInputType.includes(result)) {
            throw new Error(`Invalid input type: ${result}`);
        };
        return result as InputType;
    }
    export function parseDefaultValue(arg: string): any | undefined {
        if (!hasDefaultValue(arg)) {
            return;
        };
        const result = arg.split("=").pop();
        return InputTypeCastConstructor[parseType(arg)](result);
    }
    export function parseName(arg: string): string {
        return arg.split(/[:=]/)[0];
    }
}