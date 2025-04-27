import { BlockType, DataStorer, Extension } from "@framework/structs";
enum State {
    WALK, STAND, ATTACK
}
interface CharacterInfo {
    hitbox: Hitbox;
    healthMaxBase: number;
    attackBase: number;
};
class Vector {
    x: number;
    y: number;
    constructor(x: number = 0, y: number = 0) {
        this.x = x ?? 0;
        this.y = y ?? 0;
    }
    static get ZERO() {
        return new Vector(0, 0);
    }
}
class Hitbox {
    position: Vector;
    size: Vector;
    constructor(position?: Vector, size?: Vector) {
        this.position = position ?? Vector.ZERO;
        this.size = size ?? Vector.ZERO;
    };
}
class StateMachine {
    name: string;
    position: Vector;
    state: State = State.STAND;
    bind: CharacterInfo;
    constructor(name?: string) {
        this.name = name ?? "unnamed";
        this.position = {
            x: 0,
            y: 0
        };
        this.bind = {
            hitbox: new Hitbox,
            healthMaxBase: 100,
            attackBase: 10
        };
    }
}
const data = new DataStorer({
    machines: [] as StateMachine[]
});
export default class FightController extends Extension {
    id: string = "fighter";
    displayName: string = "格斗控制器";
    @BlockType.Command("create statemachine [name]")
    createStateMachine({ name }: { name: string }) {
        data.write("machines", new StateMachine(name));
    }
    @BlockType.Command("set [attr] of [name] to [value]")
    setAttr<T extends keyof StateMachine>({ attr, name, value }: { attr: T, name: string, value: StateMachine[T] }) {
        const target = this.find({ name });
        if (target) {
            target[attr] = value;
        };
    }
    @BlockType.Reporter("find [name]")
    find({ name }: { name: string }) {
        return data.read("machines").find(e => e.name === name) ?? null;
    }
};