import { ExtensionLoadError } from "@framework/exceptions";
import type { LoaderConfig } from "@framework/internal";
import { Extensions } from "@framework/index";
Extensions.justPlaceholder();
const config: LoaderConfig = {
    target: import("@src/extension"),
    errorCatches: [Error, ExtensionLoadError],
    platform: ["GandiIDE"],
    mode: "debug"
};
export default config;