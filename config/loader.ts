import { ExtensionLoadError } from "@framework/exceptions";
import type { LoaderConfig } from "@framework/internal";
import Extension from "@src/extension";
const config: LoaderConfig = {
    target: Extension,
    errorCatches: [Error, ExtensionLoadError],
    platform: ["TurboWarp"],
    mode: "debug"
};
export default config;