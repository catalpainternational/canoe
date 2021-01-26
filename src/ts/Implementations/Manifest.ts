/* eslint-disable @typescript-eslint/no-unused-vars */
import { LoadingCallback } from "ts/Callbacks";
import { IManifest } from "ts/Interfaces/IManifest";
import { IPage } from "ts/Interfaces/IPage";
import { TPage } from "ts/Types/ManifestTypes";

import { storeManifest, getManifestFromStore } from "ReduxImpl/Interface";

// See ts/Typings for the type definitions for these imports
import { store } from "ReduxImpl/Store";
import { getAuthenticationToken } from "js/AuthenticationUtilities";
import { ROUTES_FOR_REGISTRATION } from "js/urls";

export class Manifest implements IManifest {
    data!: Record<string, any>;
    get version(): string {
        return this.data && this.data.version ? this.data.version : undefined;
    }
    get pages(): Record<string, TPage> {
        return this.data && this.data.pages ? this.data.pages : undefined;
    }

    constructor() {
        this.initialiseFromStore();
    }
    /** This is a basic integrity check.  It ensures that:
     * - All child pages have matching page entries
     */
    get isValid(): boolean {
        if (this.pages === undefined) {
            return false;
        }
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
        return false;
    }

    get isPublishable(): boolean {
        return false;
    }

    initialiseFromStore(): any {
        this.data = getManifestFromStore();
    }

    async initialiseByRequest(): Promise<void> {
        const resp = await fetch(`${ROUTES_FOR_REGISTRATION.manifest}/v1`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `JWT ${getAuthenticationToken()}`,
            },
        });
        this.data = await resp.json();
        storeManifest(this.data);
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
