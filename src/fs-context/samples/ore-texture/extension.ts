import { InputLoader } from "@framework/internal";
import { BlockType, Extension } from "@framework/structs";
import seedRandom, { PRNG } from "seedrandom";
export default class OreTexture extends Extension {
    id: string = "oretexture";
    displayName: string = "矿石纹理生成器";
    loaders: Record<string, InputLoader> = {
        rng: {
            load(data) {
                return seedRandom(data);
            }
        }
    };
    @BlockType.Reporter("赤铜矿[seed:rng=114514]")
    Redcopper({ seed }: { seed: PRNG }) {
        return(seed);
    };
};