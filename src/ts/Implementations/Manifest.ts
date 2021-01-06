/* eslint-disable @typescript-eslint/no-unused-vars */
import { LoadingCallback } from "../Callbacks";
import { IManifest } from "../Interfaces/IManifest";
import { IPage } from "../Interfaces/IPage";
import { TPage } from "../Types/ManifestTypes";

import { getManifestFromStore, storeManifest } from "ReduxImpl/Interface";
import { fetchManifest } from "js/WagtailPagesAPI";

export class Manifest implements IManifest {
    version: string;
    pages: Record<string, TPage>;

    /** This is a basic integrity check.  It ensures that:
     * - All child pages have matching page entries
     */
    get isValid(): boolean {
        const allPageNames = Object.keys(this.pages).sort() as string[];
        let childPageNames: Set<string> = new Set();
        allPageNames.forEach((pageName) => {
            childPageNames = new Set([
                ...childPageNames,
                ...this.pages[pageName].children.map((c) => c.toString()),
            ]);
        });
        const matchedPages = new Set([...allPageNames, ...childPageNames]);

        return matchedPages === childPageNames;
    }

    get isAvailableOffline(): boolean {
        if (this.version === "0.0.0") {
            return false;
        }

        return this.isValid;
    }

    get isPublishable(): boolean {
        if (this.version === "0.0.0") {
            return false;
        }

        return true;
    }

    constructor() {
        this.version = "0.0.0";
        this.pages = {
            "0": {
                loc_hash: "/site/manifest-loading",
                storage_container: "/site/manifest-loading",
                version: 3,
                api_url: "/api/v2/pages/0/",
                assets: [],
                language: "en",
                children: [],
                depth: 0,
            },
        };

        if (!this.isPublishable) {
            this.getOrFetchManifest()
                .then((mani: any) => {
                    if (mani?.pages) {
                        this.version = mani.version;
                        this.pages = mani.pages;
                    }
                })
                .catch((_) => {
                    // Swallow the error, this will leave us with the default 'manifest'
                });
        }
    }

    async getOrFetchManifest(): Promise<any> {
        const manifestInStore = getManifestFromStore();

        if (Object.entries(manifestInStore).length > 0) {
            return manifestInStore;
        }

        const manifest = await fetchManifest();
        storeManifest(manifest);
        return manifest;
    }

    getHomePageHash(
        languageCode: string,
        loadingCallback: LoadingCallback
    ): string {
        throw new Error("Method not implemented.");
    }

    getPageData(
        locationHash: string,
        languageCode: string,
        loadingCallback: LoadingCallback
    ): Record<string, unknown> {
        throw new Error("Method not implemented.");
    }

    getPageDetail(locationHash: string, languageCode: string): IPage {
        throw new Error("Method not implemented.");
    }
}

/** Gets the manifest either from the store, cache, or network.
async function getManifest(
    manifestUri: string,
    store: CanoeStore,
    cache: CanoeCache,
    fetch: CanoeFetch,
    handleLoading: (options: Record<string, unknown>) => void
) {
    let manifest = store.getManifest();

    // try to get the manifest from cache
    if (manifest === undefined) {
        handleLoading({ msg: "Requesting manifest from cache" });
        manifest = await cache.getManifest(manifestUri);
        store.updateManifest(manifest);
    }

    // try to get the manifest from network
    if (manifest === undefined) {
        handleLoading({ msg: "Requesting manifest from network" });
        manifest = await fetch.getManifest(manifestUri);
        store.updateManifest(manifest);
        cache.updateManifest(manifest);
    }

    return manifest;
}

async function getPrimaryResource(
    resourceGroup: ResourceGroupDescriptor,
    store: CanoeStore,
    cache: CanoeCache,
    fetch: CanoeFetch,
    handleLoading: (options: Record<string, unknown>) => void
) {
    let primaryResource = store.getResource(resourceGroup.primary);

    // try to get the resource from cache
    if (primaryResource === undefined) {
        handleLoading({ msg: "Requesting resource from cache" });
        primaryResource = await cache.getResource(resourceGroup.primary);
        store.updateResource(resourceGroup.primary, primaryResource);
    }
    // try to get the resource from network
    if (primaryResource === undefined) {
        // we don't have resource, get it from the internet
        handleLoading({ msg: "Requesting resource from network" });
        primaryResource = await fetch.getResource(resourceGroup.primary);
        store.updateResource(resourceGroup.primary, primaryResource);
        cache.updateResource(resourceGroup.primary, primaryResource);
    }

    return primaryResource;
}
*/
