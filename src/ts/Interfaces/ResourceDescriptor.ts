/** Describes a single resource, where to get it, where to store it */
interface ResourceDescriptor {
    /** where to request this resource from */
    uri: string;
    /** where to save/access this resource in the store */
    storeKey: string;
}

/** Describe a group of resources */
interface ResourceGroupDescriptor {
    /** the main resource without which we cannot render the page */
    primary: ResourceDescriptor;
    /** dependent resources which should be present to assure offline capability */
    dependents: ResourceDescriptor[];
}

export { ResourceDescriptor, ResourceGroupDescriptor };
