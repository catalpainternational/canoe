import { CanoeManifest } from "./Manifest";
import { ResourceDescriptor } from "./ResourceDescriptor";

/** CanoeStore - Provide a consistent state implementation to the typescript tools */
export interface CanoeStore {
    /** Get the manifest from the store if present */
    getManifest(): CanoeManifest | undefined;

    /** Update the store manifest if defined */
    updateManifest(manifest: CanoeManifest | undefined): void;

    /** Get the resource group from the store if present */
    getResource(
        descriptor: ResourceDescriptor
    ): Record<string, unknown> | undefined;

    /** Update the resource group in the cache if present */
    updateResource(
        descriptor: ResourceDescriptor,
        resource: Record<string, unknown> | undefined
    ): Promise<void>;
}
