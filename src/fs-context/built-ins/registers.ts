import type { ExtensionRegister } from "@framework/internal";
export const TurboWarp: ExtensionRegister = (metadata, scratch) => {
    scratch.extensions.register(new metadata.constructors.generated(scratch));
};
export const GandiIDE: ExtensionRegister = TurboWarp;