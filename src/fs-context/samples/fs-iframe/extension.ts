import { ElementContext, Scratch } from "@framework/internal";
import { Block, Collaborator, Extension, Translator, Version } from "@framework/structs";
import { GlobalContext, Unnecessary } from "@framework/tools";
import "./style.css";
const translator = Translator.create("zh-cn", {
    name: "内嵌网页",
    description: "使用iframe嵌入网页",
    create: "创建名为$name的Iframe于$pos，尺寸$size，图层$layer",
    setUrl: "设置$name的URL为$url",
    move: "移动$name到$pos",
    resize: "调整$name的尺寸为$size",
    setLayer: "设置$name的图层为$layer",
    remove: "移除$name",
    get: "获取$name的URL"
});
interface Position {
    x: number;
    y: number;
}
export default class FSIFrame extends Extension {
    id = "fsiframe";
    displayName = translator.load("name");
    version = new Version(1, 1, 4);
    description = translator.load("description");
    collaborators = [
        new Collaborator("FallingShrimp", "https://rundll86.github.io")
    ];
    allowSandboxed = false;
    blocks = [
        Block.create(translator.load("create"), {
            arguments: [
                {
                    name: "$name"
                },
                {
                    name: "$pos",
                    value: "0 0"
                },
                {
                    name: "$size",
                    value: "480 270"
                },
                {
                    name: "$layer",
                    value: "0"
                }
            ]
        }, function createIF(arg) {
            if (document.getElementById(`fsiframe-${arg.$name}`)) return;
            const pos = parsePos(arg.$pos);
            const size = parsePos(arg.$size);
            const iframe = Unnecessary.elementTree("iframe")
                .class("fsi-iframe")
                .style("left", `${pos.x}px`)
                .style("top", `${pos.y}px`)
                .style("width", `${size.x}px`)
                .style("height", `${size.y}px`)
                .style("zIndex", arg.$layer)
                .attribute("id", `fsiframe-${arg.$name}`)
                .data("ratio-x", size.x / (this.canvas?.clientWidth || size.x))
                .data("ratio-y", size.y / (this.canvas?.clientHeight || size.y));
            dataStore.read("rootBase").child(iframe);
            dataStore.write("iframes", iframe);
            const update = () => {
                if (this.canvas) {
                    iframe
                        .style("width", `${this.canvas.clientWidth * iframe.data("ratio-x")}px`)
                        .style("height", `${this.canvas.clientHeight * iframe.data("ratio-y")}px`);
                };
                requestAnimationFrame(update);
            };
            requestAnimationFrame(update);
        }),
        Block.create(translator.load("setUrl"), {
            arguments: [
                {
                    name: "$name"
                },
                {
                    name: "$url",
                    value: "https://rundll86.github.io"
                }
            ]
        }, function setUrl(arg) {
            document.getElementById(`fsiframe-${arg.$name}`)
                ?.setAttribute("src", arg.$url);
        }),
        Block.create(translator.load("move"), {
            arguments: [
                {
                    name: "$name"
                },
                {
                    name: "$pos",
                    value: "0 0"
                }
            ]
        }, function move(arg) {
            const pos = parsePos(arg.$pos);
            const iframe = document.getElementById(`fsiframe-${arg.$name}`);
            iframe?.style.setProperty("left", `${pos.x}px`);
            iframe?.style.setProperty("top", `${pos.y}px`);
        }),
        Block.create(translator.load("resize"), {
            arguments: [
                {
                    name: "$name"
                },
                {
                    name: "$size",
                    value: "480 270"
                }
            ]
        }, function resize(arg) {
            const size = parsePos(arg.$size);
            const iframe = document.getElementById(`fsiframe-${arg.$name}`);
            iframe?.style.setProperty("width", `${size.x}px`);
            iframe?.style.setProperty("height", `${size.y}px`);
        }),
        Block.create(translator.load("setLayer"), {
            arguments: [
                {
                    name: "$name"
                },
                {
                    name: "$layer",
                    value: "0"
                }
            ]
        }, function setLayer(arg) {
            const iframe = document.getElementById(`fsiframe-${arg.$name}`);
            iframe?.style.setProperty("zIndex", arg.$layer);
        }),
        Block.create(translator.load("remove"), {
            arguments: [
                {
                    name: "$name"
                }
            ]
        }, function remove(arg) {
            document.getElementById(`fsiframe-${arg.$name}`)?.remove();
        }),
        Block.create(translator.load("get"), {
            arguments: [
                {
                    name: "$name"
                }
            ],
            type: "reporter"
        }, function get(arg) {
            return document.getElementById(`fsiframe-${arg.$name}`)?.getAttribute("src");
        })
    ];
    init(runtime: Scratch) {
        runtime.renderer.canvas.parentElement?.appendChild(
            dataStore.read("rootBase").result
        );
    }
};
function parsePos(text: string): Position {
    const arr = text.split(" ");
    return {
        x: Number(arr[0]),
        y: Number(arr[1])
    };
}
const dataStore = GlobalContext.createDataStore(FSIFrame, {
    iframes: [] as ElementContext<HTMLIFrameElement>[],
    rootBase: Unnecessary.elementTree("div").class("fsi-base")
});