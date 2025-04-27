import { json, textArray } from "@framework/built-ins/loaders";
import { InputLoader } from "@framework/internal";
import { BlockType, DataStorer, Extension } from "@framework/structs";
interface PrototypeDefine {
    name: string;
    ownAttrs: string[];
    extended: string;
    get attrs(): string[];
}
interface ObjectCreated {
    name: string;
    proto: string;
    attrs: Record<string, string>;
    get validAttrs(): Record<string, string>;
}
const data = new DataStorer({
    protos: [] as PrototypeDefine[],
    objects: [] as ObjectCreated[]
});
function findPrototype(name: string) {
    return data.read("protos").find(proto => proto.name === name);
};
function findObject(name: string) {
    return data.read("objects").find(obj => obj.name === name);
}
export default class UseOOPInGandi extends Extension {
    id = "useoopingandi";
    displayName = "Use OOP in Gandi";
    loaders: Record<string, InputLoader> = { textArray, json };
    @BlockType.Command("Create prototype [name=Wolf] with attrs [attrs:textArray=name,height,length] extends [extends=Object]")
    useOOPInGandi(args: { name: string, attrs: string[], extends: string }) {
        data.write("protos", {
            name: args.name,
            ownAttrs: args.attrs,
            extended: findPrototype(args.extends)?.name || "Object",
            get attrs() {
                return [...findPrototype(args.extends)?.attrs || [], ...args.attrs];
            }
        });
    }
    @BlockType.Command("Instance [proto=Wolf] as [name=lycaon] filled attrs [attrs:textArray=VonLycaon,1.85m,18cm]")
    createObject(args: { proto: string, name: string, attrs: string[] }) {
        const myProto = findPrototype(args.proto);
        if (!myProto) { return; };
        const myAttrs: Record<string, string> = {};
        myProto.attrs.forEach((attr, i) => {
            if (args.attrs.length <= i) return;
            myAttrs[attr] = args.attrs[i];
        });
        data.write("objects", {
            name: args.name,
            proto: args.proto,
            attrs: myAttrs,
            get validAttrs() {
                return Object.fromEntries(Object.entries(myAttrs).filter(([key]) => myProto.attrs.includes(key)));
            }
        });
    }
    @BlockType.Reporter("Get [attr=name] of [obj=lycaon]")
    getAttr(args: { attr: string, obj: string }) {
        const myObj = findObject(args.obj);
        if (!myObj) { return; };
        return myObj.validAttrs[args.attr];
    }
    @BlockType.Command("Set [attr=length] of [obj=lycaon] to [value=22cm]")
    setAttr(args: { attr: string, obj: string, value: string }) {
        const myObj = findObject(args.obj);
        if (!myObj) { return; };
        myObj.attrs[args.attr] = args.value;
    }
    @BlockType.Command("Remove [attr=name] of [obj=lycaon]")
    removeAttr(args: { attr: string, obj: string }) {
        const myObj = findObject(args.obj);
        if (!myObj) { return; };
        delete myObj.attrs[args.attr];
    }
    @BlockType.Reporter("Get prototype of [obj=lycaon]")
    getProto(args: { obj: string }) {
        const myObj = findObject(args.obj);
        if (!myObj) { return; };
        return myObj.proto;
    }
    @BlockType.Reporter("Get [attr=name] of prototype [proto=Wolf]")
    getProtoAttr(args: { attr: string, proto: string }) {
        const myProto = findPrototype(args.proto);
        if (!myProto) { return; };
        return myProto.attrs.includes(args.attr);
    }
    @BlockType.Command("Add [attr=height] to prototype [proto=Wolf]")
    addProtoAttr(args: { attr: string, proto: string }) {
        const myProto = findPrototype(args.proto);
        if (!myProto) { return; };
        myProto.ownAttrs.push(args.attr);
    }
    @BlockType.Command("Remove [attr=height] from prototype [proto=Wolf]")
    removeProtoAttr(args: { attr: string, proto: string }) {
        const myProto = findPrototype(args.proto);
        if (!myProto) { return; };
        myProto.ownAttrs = myProto.ownAttrs.filter(attr => attr !== args.attr);
    }
}