import { ResourceGroupDescriptor } from "./ResourceDescriptor";

export interface CanoeManifest {
    /** Gets a resource group from a given location hash, throws error if not found */
    getResourceGroup(locationHash: string): ResourceGroupDescriptor;
}
