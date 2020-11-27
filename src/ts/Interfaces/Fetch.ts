import { CanoeManifest } from "./Manifest";
import { ResourceDescriptor } from "./ResourceDescriptor";

export interface CanoeFetch {
    /** Get the manifest from the network if present */
    getManifest(manifestUri: string): Promise<CanoeManifest>;

    /** Get the resource object from the network if present */
    getResource(
        descriptor: ResourceDescriptor
    ): Promise<Record<string, unknown>>;
}
