/* CanoeStore
 Provide a consistent state implementation to the typescript tools

*/
import { CanoeManifest } from "./Manifest"
import { ResourceDescriptor } from "./ResourceDescriptor"


export interface CanoeStore {

    /** get the manifest from the store if present */
    getManifest(): CanoeManifest | undefined;

    /** update the store manifest if defined */
    updateManifest(manifest: CanoeManifest | undefined): void;

    /** get the resource group from the store if present */
    getResource(descriptor: ResourceDescriptor): object | undefined;

    /** update the resource group in the cache if present */
    updateResource(descriptor: ResourceDescriptor, resource: object | undefined): Promise<void>;
}