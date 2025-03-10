import { Extensions } from ".";
import type { ScratchWaterBoxed } from "@framework/internal";
import loaderConfig from "@config/loader";
export default async function load() {
    const currentScratch = Extensions.getScratch() as ScratchWaterBoxed;
    if (currentScratch) {
        const { default: target } = await loaderConfig.target;
        const extensionLoaded = await Extensions.load(target);
        if (loaderConfig.mode === "debug") {
            extensionLoaded.debugPrint();
            console.warn("You're running on a Debug environment, don't publish it on production! It could divulge Scratch Runtime.");
            console.warn("Check `mode` of @config/loader.ts to `release` to close this warning.");
        };
        extensionLoaded.to(...loaderConfig.platform);
        if (Extensions.isInWaterBoxed()) {
            currentScratch.loadTempExt();
        };
    };
};
export const result = load();