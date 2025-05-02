import type { ExtensionRegister, FilterKey, FilterOut } from "@framework/internal";
export const TurboWarp: ExtensionRegister = (metadata, scratch) => {
    scratch.extensions.register(metadata.objectGenerated);
};
export const GandiIDE: ExtensionRegister = (metadata) => {
    window.tempExt = {
        Extension: metadata.constructors.generated,
        info: {
            extensionId: metadata.objectPlain.id,
            name: metadata.objectPlain.displayName,
            description: metadata.objectPlain.description,
            featured: true,
            disabled: false,
            collaboratorList: metadata.objectPlain.collaborators
        }
    };
};
export const InternalRegisters: Record<FilterOut<keyof typeof import("./registers"), "InternalRegisters">, string> = Object.keys(require("./registers")).reduce((pre, cur) => {
    pre[cur] = cur;
    return pre;
}, {} as Record<string, string>);