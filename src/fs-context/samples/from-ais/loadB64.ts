import { Block, Extension, Translator, Version, BlockType } from "@framework/structs";
import { GlobalContext } from "@framework/tools";

// 创建一个翻译器实例，用于翻译插件名称和描述等
const translator = Translator.create("zh-cn", {
    name: "Base64 Image Loader",
    description: "加载Base64编码的图片",
    loadImage: "加载Base64图片[base64:string]"
});

export default class Base64ImageLoader extends Extension {
    // 定义插件的唯一标识符
    id = "base64-image-loader";
    // 定义插件的显示名称
    displayName = translator.load("name");
    // 定义插件的版本
    version = new Version(1, 0, 0);
    // 定义插件的描述
    description = translator.load("description");

    // 定义一个报告者类型的块，用于加载Base64编码的图片
    @BlockType.Reporter(translator.load("loadImage"))
    async loadImage(args: { base64: string }) {
        return new Promise((resolve, reject) => {
            const image = new Image();
            // 当图片加载成功时，解析Promise
            image.onload = () => resolve(image);
            // 当图片加载失败时，拒绝Promise
            image.onerror = () => reject(new Error("Failed to load image"));
            // 确保base64字符串包含正确的前缀
            const base64Data = args.base64.startsWith('data:image')
                ? args.base64
                : `data:image/png;base64,${args.base64}`;
            // 设置图片的源为Base64数据
            image.src = base64Data;
        });
    }
}