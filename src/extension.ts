import * as exceptions from "@framework/exceptions";
import { ColorDefine, InputLoader } from "@framework/internal";
import { Block, Collaborator, Extension, Menu, Translator, Version } from "@framework/structs";
import { GlobalContext, Unnecessary } from "@framework/tools";
import { html, json, vector2, vector3 } from "@framework/built-ins/loaders";
const translator = Translator.create("zh-cn", {
    name: "我的拓展",
    des: "这是我的第一个拓展"
});
translator.store("en", {
    name: "My Extension",
    des: "This is my first extension"
});
export default class MyExtension extends Extension {
    loaders: Record<string, InputLoader> = { vector2, json, html, vector3 };
    blocks: Block<MyExtension>[] = [
        Block.create("TestBlock $vec2 $vec3 $json $html", {
            arguments: [
                {
                    name: "$vec2",
                    inputType: "vector2"
                },
                {
                    name: "$vec3",
                    inputType: "vector3"
                },
                {
                    name: "$json",
                    inputType: "json"
                },
                {
                    name: "$html",
                    inputType: "html"
                }
            ]
        }, function (args) {
            console.log(args);
        })
    ];
    id = "myextension";
    displayName = translator.load("name");
    version = new Version(1, 0, 0);
    menus = [
        new Menu("fruits", [
            { name: "苹果", value: "apple" },
            { name: "香蕉", value: "banana" },
            { name: "橙子", value: "orange" },
            { name: "西瓜", value: "watermelon" }
        ]),
        new Menu("vegetables", [
            "土豆=potato",
            "胡萝卜=carrot",
            "Unnamed vegitable",
            {
                name: "Named vegitable of Onion",
                value: "onion"
            },
            "Cabbage白菜"
        ]),
        new Menu("sauces", "番茄酱=ketchup,蛋黄酱=mayonnaise,mushroom,辣椒酱=hot sauce")
    ]
    description = translator.load("des");
    collaborators = [
        new Collaborator("FallingShrimp", "https://f-shrimp.solariix.com")
    ];
    colors: ColorDefine = {
        theme: "#ff0000"
    };
    autoDeriveColors = true;
    // @BlockType.Command("alert[sth:string=hello]with suffix[suffix:menu=suffixes]")
    // alertTest(args: AnyArg) {
    //     alert(args.sth + " " + args.suffix);
    //     dataStore.write("alertedSth", args.sth.toString());
    //     dataStore.write("lastSuffix", args.suffix.toString());
    // };
    // @BlockType.Reporter("getAlertedSth")
    // getAlertedSth() {
    //     return dataStore.read("alertedSth");
    // };
    // @BlockType.Reporter("getLastSuffix")
    // getLastSuffix() {
    //     return dataStore.read("lastSuffix");
    // };
};
const dataStore = GlobalContext.createDataStore(MyExtension, {
    alertedSth: [] as string[],
    lastSuffix: "",
    tools: Unnecessary,
    fruitsEaten: [] as string[],
    exceptions
});