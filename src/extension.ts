import { InputLoader } from "@framework/internal";
import { BlockMode, BlockType, Extension } from "@framework/structs";
import { Random } from "@framework/tools";
export default class MyExtension extends Extension {
    id = "myextension";
    displayName = "My Extension";
    loaders: Record<string, InputLoader> = {
        textarray: {
            load(data) {
                return data.split(/[,;|]/);
            },
        }
    };
    @BlockType.Boolean("随机返回[data:textarray]中的一个")
    randomReturn({ data }: { data: string[] }) {
        return data[Random.integer(0, data.length - 1)];
    }
    @BlockMode.Filt("sprite")
    @BlockMode.UseMonitor
    @BlockMode.ThreadRestartable
    @BlockMode.ActiveEdge
    @BlockType.Reporter([
        "计算[num1:number=114]+[num2:number=514]",
        "计算[num1:number=114]-[num2:number=514]",
        "计算[num1:number=114]*[num2:number=514]",
        "计算[num1:number=114]/[num2:number=514]"
    ]) calc({ num1, num2 }: { num1: number; num2: number }, overloadIndex: number) {
        const overloadMap = [
            (a: number, b: number) => a + b,
            (a: number, b: number) => a - b,
            (a: number, b: number) => a * b,
            (a: number, b: number) => a / b
        ];
        return overloadMap[overloadIndex](num1, num2);
    }
    @BlockMode.Hidden
    @BlockType.Command("这个积木已隐藏")
    hiddenBlock() { }
};