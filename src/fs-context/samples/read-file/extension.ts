import { BlockType, Extension } from "@framework/structs";
import { Unnecessary } from "@framework/tools";
export default class ReadFile extends Extension {
    id = "filereader";
    displayName = "福瑞占领世界";
    @BlockType.Reporter("读文件并返回文件名和b64")
    async readFile() {
        const file = await Unnecessary.uploadFile();
        const content = await Unnecessary.readFile(file, "dataurl");
        return {
            filename: file.name,
            dataurl: content
        };
    }
};