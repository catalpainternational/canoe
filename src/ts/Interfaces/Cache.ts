/* CanoeCache
 Provide a consistent state interface

*/
import { CanoeManifest } from "./Manifest"
import { ResourceDescriptor } from "./ResourceDescriptor"


export interface CanoeCache {

    /** get the manifest from the cache if present */
    getManifest(uri: string): Promise<CanoeManifest | undefined>;

    /** update the cache manifest if defined */
    updateManifest(manifest: CanoeManifest | undefined): Promise<void>;

    /** get the resource object from the cache if present */
    getResource(descriptor: ResourceDescriptor): Promise<object | undefined>;

    /** update the resource group in the cache if present */
    updateResource(descriptor: ResourceDescriptor, resource: object | undefined): Promise<void>;
}