import { Manifest } from "../Implementations/Manifest";

export function buildFakeManifest(): Manifest {
    const fakeMani = Manifest.getInstance();
    return fakeMani;
}
