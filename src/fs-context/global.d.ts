type Scratch = import("./internal").Scratch;
type ScratchWaterBoxed = import("./internal").ScratchWaterBoxed;
type ExtensionPlain = import("./internal").ExtensionPlain;
type GlobalResourceMachine = import("./internal").GlobalResourceMachine;
type BlockPlain = import("./internal").BlockPlain;
declare module "*.vue" {
    const content: import("vue").Component;
    export default content;
}
declare module "*.html" {
    const content: string;
    export default content;
}
declare module "*.md" {
    const content: string;
    export default content;
}
declare module "*.css" {
    const content: Record<string, never>;
    export default content;
}
declare module "*.svg" {
    const content: string;
    export default content;
}
declare interface Window {
    ScratchWaterBoxed?: ScratchWaterBoxed;
    Scratch?: Scratch;
    __VUE_OPTIONS_API__: boolean;
    __VUE_PROD_DEVTOOLS__: boolean;
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: boolean;
    tempExt?: {
        Extension: new (runtime: Scratch) => ExtensionPlain,
        info: {
            extensionId: string,
            name: string,
            description: string,
            featured: boolean,
            disabled: boolean,
            collaboratorList: import("./structs").Collaborator[]
        }
    };
    _FSContext?: GlobalResourceMachine;
    callErrorOverlay?: (error: Error) => void;
    ScratchBlocks?: BlockPlain[];
}