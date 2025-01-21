import { Extension, Translator, Version, BlockType } from "@framework/structs";

const translator = Translator.create("zh-cn", {
    name: "DataURL Loader",
    description: "加载DataURL并返回文本内容",
    loadDataURL: "加载DataURL[dataurl:string]并返回文本"
});

export default class DataURLLoader extends Extension {
    id = "dataurl-loader";
    displayName = translator.load("name");
    version = new Version(1, 0, 0);
    description = translator.load("description");

    @BlockType.Reporter(translator.load("loadDataURL"))
    async loadDataURL(args: { dataurl: string }) {
        const response = await fetch(args.dataurl);
        const text = await response.text();
        return text;
    }
}