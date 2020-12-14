/** Describes a single resource, its type, and where to get it */
export interface IResource {
    /** where to request this resource from */
    uri: string;
    /** what type of resource, for example image or video */
    type: string;

    /** is this resource available offline, in a named container */
    availableOffline(storageContainer: string): Promise<boolean>;
}
