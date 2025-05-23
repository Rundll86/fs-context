import { BlockType, Extension, Menu, MenuMode } from "@framework/structs";
import { Random } from "@framework/tools";

export default class ApplePie extends Extension {
    id: string = "applepie";
    displayName: string = "苹果派";
    description: string = "响应式菜单/内联菜单/动态回读 示例";

    /* 每次回读时对菜单项进行随机排序 */
    @MenuMode.Readback((menu) => menu.generated.sort(() => Random.float(-1, 1)))
    @MenuMode.Reactive(true)
    appleNames = new Menu("苹果,智慧果,超凡子,Apple,林檎");

    @BlockType.Reporter("随机返回一种苹果")
    returnRandomApple() {
        return Random.choose(this.appleNames.items).name;
    }

    @BlockType.Command("添加苹果[apple:string=凤梨]")
    addApple({ apple }: { apple: string }) {
        this.appleNames.items.push({ name: apple, value: apple });
    }

    @BlockType.Command("移除苹果[apple=菠萝]")
    removeApple({ apple }: { apple: string }) {
        this.appleNames.items = this.appleNames.items
            .filter((item) => item.name !== apple);
    }

    @BlockType.Reporter("苹果的值[appleNames:menu]")
    getAppleValues({ appleNames }: { appleNames: string }) {
        return this.appleNames.items
            .find((item) => item.name === appleNames)?.value ?? "无效苹果";
    }

    @BlockType.Reporter("苹果的索引值[appleNames:menu(苹果,智慧果,超凡子,Apple,林檎)=智慧果]")
    appleValues({ appleNames }: { appleNames: number }) {
        return appleNames;
    }
};