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
            version: this.manifest.version,
            type: "manifest",
            storeStatus: this.manifest.status.storeStatus,
            cacheStatus: this.manifest.status.cacheStatus,
            isValid: this.manifest.isValid,
            isAvailableOffline: this.manifest.isAvailableOffline,
            isPublishable: this.manifest.isPublishable,
        };
    }

    PageListing([pageId, manifestPage]: any[]): TItemListing {
        const pageStatus = getItemStorageStatus(manifestPage.api_url);
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
            const page = new Page(this.manifest, pageId, manifestPage.api_url);
            isValid = page.isValid;
            isAvailableOffline = page.isAvailableOffline;
            isPublishable = page.isPublishable;
        } else {
            status.storeStatus = "unset";
        }
        // TODO: add code to get item status (isValid, etc.)
        return {
            id: pageId,
            api_url: manifestPage.api_url,
            version: manifestPage.version,
            type: "page",
            storeStatus: status.storeStatus,
            cacheStatus: status.cacheStatus,
            isValid: isValid,
            isAvailableOffline: isAvailableOffline,
            isPublishable: isPublishable,
        };
    }

    BuildList(): void {
        this.itemListings = [];
        this.itemListings.push(this.ManifestListing());
        this.itemListings.push(
            ...Object.entries(this.manifest.pages).map(this.PageListing, this)
        );
    }
}
