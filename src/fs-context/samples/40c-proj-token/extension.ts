import { BlockType, Collaborator, Extension } from "@framework/structs";
import CryptoJS from "crypto-js";
const key = "abcd1234";
export default class Code40ProjectToken extends Extension {
    id: string = "fortycodeprojecttoken";
    collaborators: Collaborator[] = [
        new Collaborator("FallingShrimp", "https://rundll86.github.io")
    ];
    @BlockType.Reporter("当前项目ID")
    projectid() {
        return Number(window.location.hash.replace("#id=", "")) ?? -1;
    }
    @BlockType.Reporter("当前项目鉴权码")
    token() {
        return CryptoJS.AES.encrypt(JSON.stringify({
            id: this.projectid(),
            expireTime: Date.now() + 60 * 1000,
            session: Math.random().toString(32).slice(2).toUpperCase()
        }), key).toString();
    }
};