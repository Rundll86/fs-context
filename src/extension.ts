import { InputLoader } from "@framework/internal";
import { BlockMode, BlockType, Extension } from "@framework/structs";
import { DOM, Random } from "@framework/tools";
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
    @BlockMode.ToDynamic("data", { joinCh: ",", defaultValues: ["apple,pear,banana", "onion,cabbage,tomato"] })
    @BlockType.Reporter("随机返回[data:textarray]中的一个")
    randomReturn({ data }: { data: string[][] }) {
        return data.flat(Infinity)[Random.integer(0, data.length - 1)];
    }
    // @BlockMode.Filt("sprite")
    // @BlockMode.UseMonitor
    // @BlockMode.ThreadRestartable
    // @BlockMode.ActiveEdge
    // @BlockType.Reporter([
    //     "计算[num1:number=114]+[num2:number=514]",
    //     "计算[num1:number=114]-[num2:number=514]",
    //     "计算[num1:number=114]*[num2:number=514]",
    //     "计算[num1:number=114]/[num2:number=514]"
    // ]) calc({ num1, num2 }: { num1: number; num2: number }, overloadIndex: number) {
    //     const overloadMap = [
    //         (a: number, b: number) => a + b,
    //         (a: number, b: number) => a - b,
    //         (a: number, b: number) => a * b,
    //         (a: number, b: number) => a / b
    //     ];
    //     return overloadMap[overloadIndex](num1, num2);
    // }
    @BlockMode.Hidden
    @BlockType.Command("这个积木已隐藏")
    hiddenBlock() { }
};
const { elementTree } = DOM;
const tree = elementTree("div", [
    elementTree("span").attribute("innerHTML", "Hello World!"),
    elementTree("img").attribute("src", "https://example.com/image.png"),
    elementTree("div", [
        elementTree("span", [
            //@ts-ignore
            elementTree("apple").attribute("juice", 114514),
        ]),
        elementTree("img").attribute("src", "https://example.com/image.png")
    ])
]);
tree.result