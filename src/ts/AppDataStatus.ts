import { TItemListing } from "ts/Types/PublishableItemTypes";

import { Manifest } from "ts/Implementations/Manifest";
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
        return {
            id: page.id,
            api_url: page.api_url,
            version: page.version,
            type: "page",
            storeStatus: page.status.storeStatus,
            cacheStatus: page.status.cacheStatus,
            isValid: page.isValid,
            isAvailableOffline: page.isAvailableOffline,
            isPublishable: page.isPublishable,
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
