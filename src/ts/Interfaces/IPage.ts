import { IResource } from "./IResource";

/** Describe a page of resources */
export interface IPage {
    /** location hash of the resource */
    locationHash: string;
    /** the main render data without which we cannot render the page */
    renderData: Record<string, unknown>;
    /** dependent assets which should be present to assure offline capability */
    assets: IResource[];
    /** name of the storage container this should be stored in */
    storageContainer: string;
    /** language code of the resource */
    languageCode: string;

    /** is this resource available offline
     * assetTypes allows specification of images / videos
     * depth will check child resource groups to that level */
    isAvailableOffline(depth: bigint, assetTypes: string[]): boolean;

    /** is this group's container complete and ready for distribution */
    isContainerComplete(): boolean;

    /** the resource groups referenced as children of this resource group */
    getChildGroups(): IPage[];
}
