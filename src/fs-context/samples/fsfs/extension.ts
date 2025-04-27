import { BlockType, DataStorer, Extension, Menu } from "@framework/structs";
interface Node {
    name: string;
    children: Node[] | null;
    pointer: number | null;
};
type DataTypeAccepted = string | Buffer;
const data = new DataStorer({
    drivers: [{
        name: "samples",
        children: [{
            name: "hello world.txt",
            children: null,
            pointer: 0
        }],
        pointer: null
    }] as Node[],
    datas: [
        "hello world!"
    ] as DataTypeAccepted[]
});
export default class FSFS extends Extension {
    id = "fsfs";
    displayName = "FallingShrimpFileSystem(Simulation)";
    description = "A simple file system simulation.";
    menus = [
        new Menu("complete", ["自动补全=0", "不补全=1"]),
        new Menu("mkdir", ["自动创建=0", "不存在则报错=1"]),
        new Menu("type", ["文件=file", "目录=folder"])
    ];
    parsePath({ path, complete }: { path: string, complete: "0" }): [number, ...string[]];
    parsePath({ path, complete }: { path: string, complete: "1" }): string[];
    @BlockType.Reporter("解析路径[path:string=0:samples>hello world.txt]并[complete:menu]驱动器索引")
    parsePath({ path, complete }: { path: string, complete: "0" | "1" }): [number, ...string[]] | string[] {
        const paths = path.split(":");
        const parts = (paths.length > 1 ? paths[1] : paths[0]).split(">");
        let driver = Number(paths.length > 1 ? paths[0] : "0");
        driver = Number.isNaN(driver) ? 0 : driver;
        return complete === "0" ? [driver, ...parts] : parts;
    }
};