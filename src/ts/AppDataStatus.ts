import {
    TItemListing,
    TItemStorageStatus,
} from "ts/Types/PublishableItemTypes";

import { Manifest } from "ts/Implementations/Manifest";
import { TWagtailPage } from "./Types/PageTypes";
import { getItemStorageStatus } from "ReduxImpl/Interface";

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

    PageListing(page: TWagtailPage): TItemListing {
        const pageStatus = getItemStorageStatus(page.api_url);
        const status =
            pageStatus !== null
                ? (pageStatus as TItemStorageStatus)
                : ({
                      storeStatus: "unset",
                      cacheStatus: "unset",
                  } as TItemStorageStatus);
        // TODO: add code to get item status (isValid, etc.)
        return {
            id: page.id,
            api_url: page.api_url,
            version: page.version,
            type: "page",
            storeStatus: status.storeStatus,
            cacheStatus: status.cacheStatus,
            isValid: false,
            isAvailableOffline: false,
            isPublishable: false,
        };
    }

    BuildList(): void {
        this.itemListings = [];
        this.itemListings.push(this.ManifestListing());
        this.itemListings.push(
            ...Object.values(this.manifest.pages).map(this.PageListing)
        );
    }
}
