import { IAsset } from "./IAsset";
import { IManifestItemState } from "./IManifestItemState";

/** Describe a page of resources */
export interface IPage extends IManifestItemState {
    /** Location hash of the resource */
    locationHash: string;
    /** The main render data without which we cannot render the page */
    renderData: Record<string, unknown>;
    /** Dependent assets which should be present to assure offline capability */
    assets: IAsset[];
    /** Name of the storage container this should be stored in */
    storageContainer: string;
    /** Language code of the resource */
    languageCode: string;

    /** The resource groups referenced as children of this resource group */
    getChildGroups(): IPage[];
}
