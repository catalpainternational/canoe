import { IManifest } from "./Interfaces/IManifest";
import { Manifest } from "./Implementations/Manifest";

function resolveManifest(): IManifest {
    return new Manifest();
}

export { resolveManifest };
