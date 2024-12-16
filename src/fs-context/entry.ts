import { Extensions } from ".";
import type { ScratchWaterBoxed } from "@framework/internal";
export default async function load() {
    const currentScratch = Extensions.getScratch() as ScratchWaterBoxed;
    if (currentScratch) {
        const loaderConfig = Extensions.config.loader;
        const { default: target } = await loaderConfig.target;
        const extensionLoaded = await Extensions.load(target);
        extensionLoaded.debugPrint();
        extensionLoaded.to(...loaderConfig.platform);
        if (Extensions.isInWaterBoxed()) {
            currentScratch.loadTempExt();
        };
    };
};
export const result = load();