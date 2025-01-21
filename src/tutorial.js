import { Block, Extension } from "./fs-context/structs";
export default class Tutorial extends Extension {
    id = "tutorialExtension";
    displayName = "Tutorial";
    description = "This is a extension for just tutorial purposes";
    blocks = [
        Block.create("弹窗[$一些东西]到浏览器窗口里", {
            arguments: [
                {
                    name: "$一些东西", //方括号里写的参数对应的名字
                    value: "福瑞占领世界！！！", //参数的默认值
                    inputType: "string" //参数的类型，可以是字符串、数字、布尔值等
                }
            ],
            type: "command"
            /**
             * 积木类型，可以填command reporter bool等
             * command代表这是一个命令积木，也就是方形的
             * reporter代表这是一个返回值的积木，也就是圆形的
             * bool代表这是一个布尔值积木，也就是菱形的
             */
        }, args => {
            alert(args.$一些东西);
        })
    ];
};