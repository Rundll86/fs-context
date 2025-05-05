import { ColorDefine } from "@framework/internal";
import { BlockType, DataStorer, Extension, Menu, Version } from "@framework/structs";
import { ScriptPlayer } from "./decompiler";
const datas = new DataStorer({
    players: {} as Record<string, ScriptPlayer>
});
export default class ScriptEditorSDK extends Extension {
    id: string = "scripteditorsdk";
    displayName: string = "剧本编辑器 SDK";
    colors: ColorDefine = {
        theme: "#ffa500"
    };
    description: string = "用于 ScriptEditor 项目的脚本反编译器和播放器。";
    version: Version = new Version(1, 0, 0);
    menus: Menu[] = [
        new Menu("fileType", "JSON=json,GLSL=glsl,Python=py"),
        new Menu("continue", "继续播放下一节点=0,停止播放=1")
    ];
    nextState: { index: number } | null = null;
    allowSandboxed: boolean = false;
    @BlockType.Command("创建播放器，名为[name=example]")
    createPlayer({ name }: { name: string }) {
        datas.read("players")[name] = new ScriptPlayer();
    }
    @BlockType.Command("使用[player=example]反编译名为[name=data]的[fileType:menu]文件的剧本数据，使用密码[password]")
    async decompile({ name, fileType, player, password }: { name: string, fileType: string, player: string, password: string }) {
        const assetData: Uint8Array | undefined = this.runtime?.runtime.gandi.assets.find(
            (asset: { name: string, dataFormat: string }) => asset.name === name && asset.dataFormat === fileType
        )?.asset.data;
        if (assetData) {
            const playerd = datas.read("players")[player];
            try {
                await playerd.open(new Blob([assetData.buffer as ArrayBuffer]), password);
                console.log(playerd);
            } catch {
                console.error("Failed to open asset:", `${name}.${fileType}`);
            }
        } else {
            console.error("Failed to find asset:", `${name}.${fileType}`);
        }
    }
    @BlockType.Command("播放[player=example]的节点[nodeId]，并[continue:menu]")
    async playNode({ player, nodeId }: { player: string, nodeId: string }) {
        const playerd = datas.read("players")[player];
        await playerd.play(async (node) => {
            return new Promise((resolve) => {
                this.nextState = new Proxy({
                    index: 0
                }, {
                    set(target, key, newValue, receiver) {
                        if (key === "index") {
                            resolve(newValue);
                        }
                        return Reflect.set(target, key, newValue, receiver);
                    },
                });
                this.runtime?.runtime.startHatsWithParams("scripteditorsdk_whenPlayNode", {
                    parameters: {
                        player: player,
                        nodeId: node.id,
                        nodeType: node.type,
                        speaker: playerd.format(node, "talker"),
                        content: playerd.format(node, "message"),
                        feeling: playerd.format(node, "feeling"),
                        assetId: playerd.format(node, "assetId"),
                        points: JSON.stringify(node.outPoints)
                    }
                });
            })
        }, nodeId || undefined);
    }
    @BlockType.Command("下一个节点，输出索引=[nextIndex:number=0]")
    next({ nextIndex }: { nextIndex: number }) {
        if (this.nextState) {
            const targetIndex = Number(nextIndex)
            this.nextState.index = Number.isNaN(targetIndex) ? -1 : targetIndex;
        }
    }
    @BlockType.Event("当播放器[player:hat-parameter]播放节点[nodeId:hat-parameter]时，节点类型=[nodeType:hat-parameter]，说话者=[speaker:hat-parameter]，内容=[content:hat-parameter]，情绪=[feeling:hat-parameter]，资源ID=[assetId:hat-parameter]，连接点列表=[points:hat-parameter]")
    whenPlayNode() { }
}