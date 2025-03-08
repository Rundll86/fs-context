import cycleButton from "./icons/cycleButton.svg";
import type { Scratch, ExtensionPlain, BlocklyType, SourceBlockTypeButScratch, AllFunction, AcceptedInputType } from "@framework/internal";
import { TextParser } from "./tools";
import { Connection, Input } from "blockly";

function hijack(fn: AllFunction) {
    const _orig = Function.prototype.apply;
    Function.prototype.apply = (thisArg) => thisArg;
    const result = fn();
    Function.prototype.apply = _orig;
    return result;
}

function getEventListener(e: AllFunction[]) {
    return e instanceof Array ? e[e.length - 1] : e;
}

function getScratchBlocks(runtime: Scratch): BlocklyType {
    return (
        runtime.scratchBlocks ||
        window.ScratchBlocks ||
        hijack(getEventListener(runtime._events.EXTENSION_ADDED))?.ScratchBlocks
    );
}

function createSwitchButton(Blockly: BlocklyType) {
    class SwitchButton extends Blockly.FieldImage {
        initialized: boolean;
        declare sourceBlock_: SourceBlockTypeButScratch;
        constructor() {
            super(cycleButton, 25, 25, undefined, undefined, false);
            this.initialized = false;
        }
        init() {
            super.init();
            if (!this.initialized) {
                const svg = this.getSvgRoot();
                if (!svg) return;
                svg.style.cursor = "pointer";
                Blockly.bindEventWithChecks_(this.getSvgRoot(), "mousedown", this, (e) => {
                    e.stopPropagation();
                });
                Blockly.bindEventWithChecks_(this.getSvgRoot(), "click", this, this.handleClick.bind(this));
            }
            this.initialized = true;
        }
        handleClick(e: Event) {
            if (!this.sourceBlock_ || !this.sourceBlock_.workspace) return;
            if (this.sourceBlock_.workspace.isDragging()) return;
            if (this.sourceBlock_.isInFlyout) return;
            this.onClick(e);
        }
        onClick(e: Event): Event | void {
            // 切换重载逻辑
            const overloads = this.sourceBlock_.overloads_;
            const currentIndex = overloads.indexOf(this.sourceBlock_.currentOverload_);
            const nextIndex = (currentIndex + 1) % overloads.length;
            this.sourceBlock_.setOverload(overloads[nextIndex]);
        }
    }
    return SwitchButton;
}

function initOverloadedBlock(runtime: Scratch, blockDefinition: SourceBlockTypeButScratch, overloads: string[]) {
    const Blockly = getScratchBlocks(runtime);
    const SwitchButton = createSwitchButton(Blockly);

    const orgInit = blockDefinition.init;
    if (!orgInit) return;
    blockDefinition.init = function () {
        orgInit.call(this);
        this.overloads_ = overloads;
        this.currentOverload_ = overloads[0];
        this.appendDummyInput("SWITCH").appendField(new SwitchButton());
        this.setOverload(this.currentOverload_);
    };
    blockDefinition.attachShadow_ = function (input: Input, argumentType: AcceptedInputType, defaultValue = "", visible = true) {
        if (argumentType === "number" || argumentType === "string") {
            const blockType = argumentType === "number" ? "math_number" : "text";
            Blockly.Events.disable();
            const newBlock = this.workspace.newBlock(blockType) as SourceBlockTypeButScratch;
            try {
                if (argumentType === "number") {
                    newBlock.setFieldValue(defaultValue, "NUM");
                } else {
                    newBlock.setFieldValue(defaultValue, "TEXT");
                }
                newBlock.setShadow(true);
                if (!this.isInsertionMarker()) {
                    newBlock.initSvg();
                    newBlock.render(false);
                }
            } finally {
                Blockly.Events.enable();
            }
            if (Blockly.Events.isEnabled()) {
                Blockly.Events.fire(new Blockly.Events.BlockCreate(newBlock));
            }
            newBlock.outputConnection?.connect(input.connection as Connection);
        }
    };
    blockDefinition.setOverload = function (overload: string) {
        this.currentOverload_ = overload;
        this.inputList.slice().forEach(input => {
            if (input.name !== "SWITCH") {
                this.removeInput(input.name);
            }
        });
        const overloadLabelInput = this.appendValueInput("$overloadIndex");
        this.attachShadow_(overloadLabelInput, "number", overloads.indexOf(overload).toString(), false);
        overloadLabelInput.setVisible(false);
        const parts = TextParser.parsePart(overload);
        console.log(parts);
        parts.forEach((part, index) => {
            if (part.type === "text") {
                this.appendDummyInput(`TEXT${index}`).appendField(part.content);
            } else if (part.type === "input") {
                const newInput = this.appendValueInput(part.content);
                if (part.inputType === "bool") {
                    newInput.setCheck(part.inputType);
                }
                this.attachShadow_(newInput, part.inputType, part.value);
            }
        });
    };
}

function proxyBlocklyBlocksObject(runtime: Scratch) {
    const Blockly = getScratchBlocks(runtime);
    if (!Blockly) return;
    Blockly.Blocks = new Proxy(Blockly.Blocks, {
        set(target, opcode: string, blockDefinition) {
            if (isBlockHasOverloads(opcode)) {
                initOverloadedBlock(runtime, blockDefinition, flatOverloads()[opcode]);
            }
            return Reflect.set(target, opcode, blockDefinition);
        },
    });
}
function isBlockHasOverloads(blockName: string) {
    return Object.keys(flatOverloads()).includes(blockName);
}
function flatOverloads() {
    const keys = Object.keys(extInfo);
    return keys.map(key => Object.keys(extInfo[key])
        .map(opcode => ({ key: `${key}_${opcode}`, overload: extInfo[key][opcode] })))
        .flat()
        .reduce((acc, cur) => {
            acc[cur.key] = cur.overload;
            return acc;
        }, {} as Record<string, string[]>);
}
const extInfo: Record<string, Record<string, string[]>> = {};
const patchSymbol = Symbol("patchOverloadedBlocks");
export function initOverloadedBlocks(extension: ExtensionPlain): void {
    const { runtime } = extension;
    if (!runtime) { throw new Error("Cannot get Scratch runtime"); };
    if (extension[patchSymbol]) return;
    extension[patchSymbol] = true;
    proxyBlocklyBlocksObject(runtime);
    extension.getInfo().blocks.forEach((block) => {
        if (block.overloads) {
            extInfo[extension.getInfo().id] = extension.getInfo().blocks.reduce((acc, cur) => {
                if (cur.overloads) {
                    acc[cur.opcode] = cur.overloads;
                };
                return acc;
            }, {} as Record<string, string[]>);
        };
    });
}
