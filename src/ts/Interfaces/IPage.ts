import { IAsset } from "./IAsset";
import { TManifestItemState } from "ts/Types/ManifestTypes";

/** Describe a page of resources */
export interface IPage extends TManifestItemState {
    /** Location hash of the page */
    loc_hash: string;
    /** Name of the storage container this should be stored in */
    storage_container: string;
    version: number;
    /** Dependent assets which should be present to assure offline capability */
    assets: IAsset[];
    /** Language code of the page */
    language: string;
    /** Children of this page (without which it is not 'availableOffline' to the UI) */
    children: string;
    /** Depth of this page, how many steps 'down' is it */
    depth: number;
}
