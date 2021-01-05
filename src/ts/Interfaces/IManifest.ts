import { IManifestItemState } from "./IManifestItemState";
import { IPage } from "./IPage";
import { LoadingCallback } from "../Callbacks";

export interface IManifest extends IManifestItemState {
    /** Gets the home page location for a given language, throws error if not found
     * used when the app wants to direct the user to the home page (e.g. page not found go home?) */
    getHomePageHash(
        languageCode: string,
        loadingCallback: LoadingCallback
    ): string;

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
