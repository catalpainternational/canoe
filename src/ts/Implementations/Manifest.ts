/* eslint-disable @typescript-eslint/no-unused-vars */
import { LoadingCallback } from "../Callbacks";
import { IManifest } from "../Interfaces/IManifest";
import { IPage } from "../Interfaces/IPage";

export class Manifest implements IManifest {
    get isAvailableOffline(): boolean {
        return true;
    }

    get isPublishable(): boolean {
        return true;
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
