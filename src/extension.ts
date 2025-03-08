import { Block, Extension } from "@framework/structs";
export default class MyExtension extends Extension {
    id = "myextension";
    blocks: Block<any>[] = [
        Block.create([
            "计算加法：[num1] + [num2]",
            "计算减法：[num1] - [num2]",
            "计算乘法：[num1] * [num2]",
            "计算除法：[num1] / [num2]"
        ], {
            type: "reporter"
        }, (args, overloadIndex) => {
            const overloadMap = [
                (a: number, b: number) => a + b,
                (a: number, b: number) => a - b,
                (a: number, b: number) => a * b,
                (a: number, b: number) => a / b
            ];
            return overloadMap[overloadIndex](args.num1, args.num2);
        })
    ];
};