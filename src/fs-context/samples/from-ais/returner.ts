import { BlockType, Extension } from "@framework/structs";
export default class Returner extends Extension {
    id: string = "returner";
    @BlockType.Reporter("return data[data]")
    abc(arg: any) {
        return arg.data;
    }
};