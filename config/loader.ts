import { InternalRegisters } from "@framework/built-ins/registers";
import { ExtensionLoadError } from "@framework/exceptions";
import type { LoaderConfig } from "@framework/internal";
import Extension from "@samples/script-editor-sdk/scripteditorsdk";
const config: LoaderConfig = {
    target: Extension,
    errorCatches: [Error, ExtensionLoadError],
    platform: [InternalRegisters.GandiIDE],
    mode: "debug"
};
export default config;