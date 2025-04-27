import { ElementContext, Scratch } from "@framework/internal";
import { Block, DataStorer, Extension, Menu, Translator } from "@framework/structs";
import { DOM } from "@framework/tools";
import "./style.css";
const translator = Translator.create("zh-cn", {
    name: "沉沦之锚",
    description: "使用锚点机制构建可自适应的精美UI。可与「高级数据结构」联动使用。",
    clear: "清除所有组件",
    create: "创建一个$tag组件，命名为$name，锚定点$anchor%，着床点$bed%，大小$size",
    render: "渲染$name到舞台",
    append: "将$name添加为$parent的子组件",
    setAttr: "设置$name的$attr为$value"
});
export default class FallingAnchors extends Extension {
    id: string = "falling-anchors";
    displayName: string = translator.load("name");
    description: string = translator.load("description");
    allowSandboxed: boolean = false;
    blocks: Block[] = [
        Block.create(translator.load("clear"), {}, function clearAll() { dataStore.clear("componets"); }),
        Block.create(translator.load("create"), {
            arguments: [
                {
                    name: "$tag",
                    inputType: "menu",
                    value: new Menu("tags", [
                        {
                            name: "方框",
                            value: "div"
                        },
                        {
                            name: "图片",
                            value: "img"
                        },
                        {
                            name: "文本",
                            value: "span"
                        }
                    ])
                },
                {
                    name: "$name"
                },
                {
                    name: "$anchor",
                    value: "11 45"
                },
                {
                    name: "$bed",
                    value: "14 19"
                },
                {
                    name: "$size",
                    value: "10 10"
                }
            ]
        }, function createComponent(arg) {
            if (findComponent(arg.$name)) { return; };
            dataStore.write("componets", {
                name: arg.$name,
                anchor: parseVector(arg.$anchor),
                bed: parseVector(arg.$bed),
                size: arg.$size === "auto" ? "auto" : parseVector(arg.$size),
                element: DOM.elementTree(arg.$tag).class("fsa"),
                tag: arg.$tag,
                isInStage: false,
                childs: [],
                updateStyle() {
                    this.element
                        .style("left", `${this.bed.horizontal}%`)
                        .style("top", `${this.bed.vertical}%`)
                        .style("transform", `translate(${this.anchor.horizontal}%, ${this.anchor.vertical}%)`);
                    if (this.size === "auto") {
                        this.element.style("width", "auto").style("height", "auto");
                    } else {
                        this.element.style("width", `${this.size.horizontal}%`).style("height", `${this.size.vertical}%`);
                    }
                    this.childs.forEach(child => child.updateStyle());
                },
                currentRenderingTree: null
            });
        }),
        Block.create(translator.load("render"), {
            arguments: [
                {
                    name: "$name"
                }
            ]
        }, function renderComponent(arg) {
            const component = findComponent(arg.$name);
            if (!component) { return; };
            if (component.isInStage && component.currentRenderingTree) {
                dataStore.read("rootBase").result.removeChild(component.currentRenderingTree);
            };
            component.updateStyle();
            const tree = generateDomTree(component);
            dataStore.read("rootBase").child(tree);
            component.currentRenderingTree = tree;
            component.isInStage = true;
        }),
        Block.create(translator.load("append"), {
            arguments: [
                {
                    name: "$name"
                },
                {
                    name: "$parent"
                }
            ]
        }, function appendComponent(arg) {
            const component = findComponent(arg.$name);
            const parent = findComponent(arg.$parent);
            if (!component || !parent || parent.childs.includes(component)) { return; };
            parent.childs.push(component);
            component.isInStage = false;
        }),
        Block.create(translator.load("setAttr"), {
            arguments: [
                {
                    name: "$name"
                },
                {
                    name: "$attr",
                    inputType: "menu",
                    value: new Menu("acceptedAttrs", [
                        {
                            name: "背景色",
                            value: "backgroundColor"
                        },
                        {
                            name: "边框色",
                            value: "borderColor"
                        },
                        {
                            name: "边框宽度",
                            value: "borderWidth"
                        }
                    ])
                },
                {
                    name: "$value"
                }
            ]
        }, function setAttr(arg) {
            const component = findComponent(arg.$name);
            if (!component) { return; };
            component.element.style(arg.$attr, arg.$value);
        })
    ];
    init(runtime: Scratch) {
        runtime.renderer.canvas.parentElement?.appendChild(dataStore.read("rootBase").result);
    }
};
function parseVector(target: `${number} ${number}`): Vector {
    if (typeof target !== "string") { return createZeroVector(); };
    const splited = target.split(" ");
    if (splited.length !== 2) { return createZeroVector(); };
    return { horizontal: Number(splited[0]), vertical: Number(splited[1]) };
};
function createZeroVector(): Vector {
    return { horizontal: 0, vertical: 0 };
};
function findComponent(name: string): Componet | null {
    return dataStore.read("componets").find(component => component.name === name) || null;
};
function generateDomTree(target: Componet): HTMLElement {
    const result = target.element.result.cloneNode() as HTMLElement;
    target.childs.forEach(child => result.appendChild(generateDomTree(child)));
    return result;
};
interface Vector {
    horizontal: number;
    vertical: number;
};
interface Componet {
    name: string;
    anchor: Vector;
    bed: Vector;
    size: Vector | "auto";
    element: ElementContext<HTMLElement>;
    tag: keyof HTMLElementTagNameMap;
    isInStage: boolean;
    childs: Componet[];
    updateStyle: () => void;
    currentRenderingTree: HTMLElement | null;
};
const dataStore = new DataStorer({
    componets: [] as Componet[],
    rootBase: DOM.elementTree("div").class("fsa", "base")
});