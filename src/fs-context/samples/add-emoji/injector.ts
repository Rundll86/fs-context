import { BlockPlain } from "@framework/internal";
import { BlocklyInjector } from "@framework/structs";
import { Block } from "blockly";
export default class AddEmoji extends BlocklyInjector {
    override isAvailableBlock(blockInfo: BlockPlain): boolean {
        return Object.hasOwn(blockInfo, "endEmoji");
    }
    override init(block: Block, myInfo: BlockPlain & { endEmoji: string }): void {
        block.appendDummyInput("EndEmojiText").appendField(myInfo.endEmoji);
    }
};