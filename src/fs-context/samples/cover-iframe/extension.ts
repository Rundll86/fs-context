import { BlockType, Extension } from "@framework/structs";
import { DOM } from "@framework/tools";
let iframe: HTMLIFrameElement;
export default class CoverIframe extends Extension {
    allowSandboxed: boolean = false;
    id: string = "coveriframe";
    displayName: string = "覆盖IFRAME到舞台";
    @BlockType.Command("设置URL为[url:string=https://mindstry.yangyiit.top/web.html]")
    setURLTo({ url }: { url: string }) {
        iframe.src = url;
    }
    init() {
        iframe = DOM.createStageOverlay(this, "iframe");
    }
};