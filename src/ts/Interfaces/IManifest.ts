import { IManifestItemState } from "./IManifestItemState";
import { IPage } from "./IPage";
import { LoadingCallback } from "../Callbacks";
import { TPage } from "../Types/ManifestTypes";

export interface IManifest extends IManifestItemState {
    version: string;
    pages: Record<number, TPage>;

    /** Gets the primary json related to a resource group from a given location hash and language code,
     * throws error if not found
     * used when the UI receives a navigation event on a given location.hash */
    getPageData(
        locationHash: string,
        languageCode: string,
        loadingCallback: LoadingCallback
    ): Record<string, unknown>;

    /** Gets the full information related to a resource group from a given location hash and language code,
     * throws error if not found
     * used when the app needs to know information about resources e.g. is this available offline */
    getPageDetail(locationHash: string, languageCode: string): IPage;
}
