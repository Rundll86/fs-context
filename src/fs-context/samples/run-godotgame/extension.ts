import { Extension, BlockType } from "@framework/structs";
import { Binary, DOM } from "@framework/tools";
import JSZip from "jszip";
const files = [
    "audio.worklet.js",
    "html",
    "js",
    "pck",
    "wasm"
] as const;
declare const engine: {
    config: {
        getModuleConfig(loadPath: string, response: unknown): {
            locateFile(path: string): string;
        };
    };
};
const injectCode = () => {
    const data = JSON.parse("{data}");
    const engineConfigGetModuleConfigOrigin = engine.config.getModuleConfig;
    engine.config.getModuleConfig = (loadPath, response) => {
        const result = engineConfigGetModuleConfigOrigin(loadPath, response);
        const locateFileOrigin = result.locateFile;
        result.locateFile = (path) => {
            const result = locateFileOrigin(path);
            if (Object.hasOwn(data, result)) {
                return data[result];
            };
            return result;
        };
        return result;
    };
};
export default class RunGodotGame extends Extension {
    id = "rungodotgame";
    displayName = "运行Godot游戏";
    allowSandboxed = false;
    @BlockType.Command("加载GDG数据[data]并运行到舞台")
    async loadGDG(arg: { data: string }) {
        const blob = Binary.base64ToBlob(arg.data, "application/zip");
        const zip = await JSZip.loadAsync(blob);
        const data: Record<string, string> = {};
        let config: Partial<Record<typeof files[number], string | undefined>> & {
            name: string
        } | null = null;
        let entryHtml: string | null = null;
        for (const path in zip.files) {
            const file = zip.files[path];
            if (file.name === "gdgame.json") {
                config = JSON.parse(await file.async("string"));
            };
            if (file.name.endsWith(".html")) {
                entryHtml = await file.async("string");
            };
        };
        if (config && entryHtml) {
            for (const path in zip.files) {
                const file = zip.files[path];
                if (files.map(e => path === config.name + "." + e).some(Boolean)) {
                    data[path] = await file.async("base64");
                };
            };
            const injectCodeDataGiven = injectCode.toString().replace("{data}", JSON.stringify(data));
            const injectorScript = document.createElement("script");
            injectorScript.innerHTML = injectCodeDataGiven;
            entryHtml += injectorScript.outerHTML;
            const iframe = DOM.elementTree("iframe")
                .class("full")
                .attribute("src", Binary.createObjectURL(
                    entryHtml, { type: "application/html" }
                ));
            DOM.createStageOverlay(this).appendChild(iframe.result);
        };
    }
    @BlockType.Reporter("上传GDG文件并复制base64")
    async uploadFileAndCopyB64() {
        const result = (await Binary.readFile(await Binary.uploadFile("*.gdg"), "dataurl")).split(",")[1];
        navigator.clipboard.writeText(result);
        return result;
    }
    @BlockType.Command("上传GDG文件并运行到舞台")
    async uploadFileAndRun() {
        const b64 = await this.uploadFileAndCopyB64();
        this.loadGDG({ data: b64 });
    }
};