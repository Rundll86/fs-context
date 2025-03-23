import { Extensions } from ".";
import type { ScratchWaterBoxed, SubOfAbstractClassConstructor } from "@framework/internal";
import loaderConfig from "@config/loader";
import { BlocklyInjector, Extension } from "./structs";
declare let injectBlocks: (extension: ExtensionPlain) => void;
const currentScratch = Extensions.getScratch() as ScratchWaterBoxed;
if (currentScratch) {
    const { target } = loaderConfig;
    if (target.prototype instanceof Extension) {
        Extensions.load(target as typeof Extension).then(extensionLoaded => {
            if (loaderConfig.mode === "debug") {
                extensionLoaded.debugPrint();
                console.warn("You're running on a Debug environment, don't publish it on production! It could divulge Scratch Runtime.");
                console.warn("Check `mode` of @config/loader.ts to `release` to close this warning.");
            };
            extensionLoaded.to(...loaderConfig.platform);
            if (Extensions.isInWaterBoxed()) {
                currentScratch.loadTempExt();
            };
        });
    } else {
        try {
            injectBlocks = (extension) => {
                const Injector = target as SubOfAbstractClassConstructor<typeof BlocklyInjector>;
                const injector = new Injector(extension);
                injector.start();
            };
            injectBlocks.bind(null);
            console.log("Exposed injector");
        } catch {
            console.warn("injector exposer isn't created, skipping.");
        };
    };
};
export const extension = window.ScratchWaterBoxed?.currentExtensionPlain;