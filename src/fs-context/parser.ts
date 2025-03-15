import type {
    AcceptedMenuValue,
    KeyValueString,
    MenuDefine, MenuItem,
    InputType
} from "./internal";
import { ArgumentPart, InputTypeCastConstructor } from "./internal";
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
        if (!text) return [];
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
        return result as InputType;
    }
    export function parseDefaultValue(arg: string): any | undefined {
        if (!hasDefaultValue(arg)) {
            return;
        };
        const result = arg.split("=").pop();
        return InputTypeCastConstructor[parseType(arg)]?.call(window, result) ?? result;
    }
    export function parseName(arg: string): string {
        return arg.split(/[:=]/)[0];
    }
}