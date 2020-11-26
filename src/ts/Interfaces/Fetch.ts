import { CanoeManifest } from "./Manifest"
import { ResourceDescriptor } from "./ResourceDescriptor"

export interface CanoeFetch {

    /** get the manifest from the network if present */
    getManifest(manifestUri: string): CanoeManifest

    /** get the resource object from the network if present */
    getResource(descriptor: ResourceDescriptor): Promise<object>;
}