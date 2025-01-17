import { BlockType, Extension, Translator } from "@framework/structs";
import { GlobalContext } from "@framework/tools";
const translator = Translator.create("zh-cn", {
    name: "Run JS",
    description: "运行JS代码",
    run: "运行[js:string]",
    runAndGetResult: "运行[js:string]并返回结果",
    getStack: "上次JS运行异常的错误栈信息"
});
export default class FallingAnchors extends Extension {
    id: string = "runjs";
    displayName: string = translator.load("name");
    description: string = translator.load("description");
    allowSandboxed: boolean = false;
    @BlockType.Command(translator.load("run"))
    runJs(arg: Record<string, any>) {
        try {
            eval(arg.js);
        } catch (e: any) {
            dataStore.write("stack", e.stack);
        }
    }
    @BlockType.Reporter(translator.load("runAndGetResult"))
    runAndGetResult(arg: Record<string, any>) {
        try {
            return eval(arg.js);
        } catch (e: any) {
            dataStore.write("stack", e.stack);
            return undefined;
        }
    }
    @BlockType.Reporter(translator.load("getStack"))
    getStack() {
        return dataStore.read("stack");
    }
};
const dataStore = GlobalContext.createDataStore(FallingAnchors, {
    stack: ""
});