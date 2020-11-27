import { CanoeManifest } from "./Manifest";
import { ResourceDescriptor } from "./ResourceDescriptor";

/** CanoeCache - Provide a consistent state interface */
export interface CanoeCache {
    /** Get the manifest from the cache if present */
    getManifest(uri: string): Promise<CanoeManifest | undefined>;

    /** Update the cache manifest if defined */
    updateManifest(manifest: CanoeManifest | undefined): Promise<void>;

    /** Get the resource object from the cache if present */
    getResource(
        descriptor: ResourceDescriptor
    ): Promise<Record<string, unknown> | undefined>;

    /** Update the resource group in the cache if present */
    updateResource(
        descriptor: ResourceDescriptor,
        resource: Record<string, unknown> | undefined
    ): Promise<void>;
}
