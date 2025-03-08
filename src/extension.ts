import { Block, Extension } from "@framework/structs";
export default class MyExtension extends Extension {
    id = "myextension";
    blocks: Block<MyExtension>[] = [
        Block.create([
            "计算加法：[num1:number=114] + [num2:number=514]",
            "计算减法：[num1:number=191] - [num2:number=9810]",
            "计算乘法：[num1:number=0] * [num2:number=9999]",
            "计算除法：[num1:number=4] / [num2:number=2]"
        ], {
            type: "reporter"
        }, (args, overloadIndex) => {
            const overloadMap = [
                (a: number, b: number) => a + b,
                (a: number, b: number) => a - b,
                (a: number, b: number) => a * b,
                (a: number, b: number) => a / b
            ];
            return overloadMap[overloadIndex](
                args.num1,
                args.num2
            );
        })
    ];
};