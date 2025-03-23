import { BlockType, DataStorer, Extension, Menu } from "@framework/structs";
interface Path {
    name: string;
    children: Path[] | null;
    pointer: number | null;
};
type NodeTypeAccepted = string | Buffer;
const data = new DataStorer({
    drivers: [{
        name: "samples",
        children: [{
            name: "hello world.txt",
            children: null,
            pointer: 0
        }],
        pointer: null
    }] as Path[],
    nodes: [
        "hello world!"
    ] as NodeTypeAccepted[]
});
export default class FSFS extends Extension {
    id = "fsfs";
    displayName = "FallingShrimpFileSystem(Simulation)";
    description = "A simple file system simulation.";
    menus = [
        new Menu("complete", ["自动补全=0", "不补全=1"])
    ];
    @BlockType.Reporter("解析路径[path:string=0:samples>hello world.txt]并[complete:menu]驱动器索引")
    parsePath(path: string) {
        const paths = path.split(":");
        let driver = Number(paths.length > 1 ? paths[0] : "0");
        driver = Number.isNaN(driver) ? 0 : driver;
        return [driver, (paths.length > 1 ? paths[1] : paths[0]).split(">")];
    }
};