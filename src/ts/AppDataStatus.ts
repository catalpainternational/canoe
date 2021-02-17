import {
    TItemListing,
    TItemStorageStatus,
} from "ts/Types/PublishableItemTypes";

import { Manifest } from "ts/Implementations/Manifest";
import {
    getPageData as getPageDataFromStore,
    getItemStorageStatus,
} from "ReduxImpl/Interface";
import { Page } from "./Implementations/Page";
import { TWagtailPage } from "./Types/PageTypes";

/** An overview of the status for all data used by the app */
export class AppDataStatus {
    manifest: Manifest;
    itemListings: TItemListing[];

    constructor() {
        this.manifest = new Manifest();
        this.itemListings = [];
    }

    async Initialise(): Promise<string> {
        if (!this.manifest.isValid) {
            try {
                await this.manifest.initialiseByRequest();
            } catch {
                return Promise.reject(
                    "Manifest is not valid, and could not be initialised from the network"
                );
            }
        }

        if (!this.manifest.isValid) {
            return Promise.reject(
                "Manifest is not valid, and initialisation from the network failed"
            );
        }

        return Promise.resolve("Manifest valid");
    }

    ManifestListing(): TItemListing {
        return {
            id: this.manifest.id,
            api_url: this.manifest.api_url,
            cacheKey: this.manifest.cacheKey,
            version: this.manifest.version,
            type: "manifest",
            storeStatus: this.manifest.status.storeStatus,
            cacheStatus: this.manifest.status.cacheStatus,
            isValid: this.manifest.isValid,
            isAvailableOffline: this.manifest.isAvailableOffline,
            isPublishable: this.manifest.isPublishable,
        };
    }

    async PageListing(
        pageId: string,
        manifestPage: TWagtailPage
    ): Promise<TItemListing> {
        const statusId = manifestPage.api_url;
        const pageStatus = getItemStorageStatus(statusId);
        const status =
            pageStatus !== null
                ? (pageStatus as TItemStorageStatus)
                : ({
                      storeStatus: "unset",
                      cacheStatus: "unset",
                  } as TItemStorageStatus);
        const pageData = getPageDataFromStore(pageId);
        let isValid = false;
        let isAvailableOffline = false;
        let isPublishable = false;
        if (pageData) {
            status.storeStatus = "ready";
            const page = new Page(this.manifest, pageId, statusId);
            await page.initialiseFromCache();
            isValid = page.isValid;
            isAvailableOffline = page.isAvailableOffline;
            isPublishable = page.isPublishable;
        } else {
            status.storeStatus = "unset";
        }
        // TODO: add code to get item status (isValid, etc.)
        return {
            id: pageId,
            api_url: statusId,
            cacheKey: manifestPage.storage_container,
            version: manifestPage.version,
            type: "page",
            storeStatus: status.storeStatus,
            cacheStatus: status.cacheStatus,
            isValid: isValid,
            isAvailableOffline: isAvailableOffline,
            isPublishable: isPublishable,
        };
    }

    async BuildList(): Promise<void> {
        this.itemListings = [];
        this.itemListings.push(this.ManifestListing());
        const pageIds = Object.keys(this.manifest.pages);
        for (let ix = 0; ix < pageIds.length; ix++) {
            const pageId = pageIds[ix];
            const manifestPage = this.manifest.pages[pageId];
            const pageListing = await this.PageListing(pageId, manifestPage);
            this.itemListings.push(pageListing);
        }
    }
}
