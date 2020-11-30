// Canoe should
// 1. display data if it has it
// 2. display data quickly as possible ( even if old )
// 3. try to fetch data if it has to ( display something while it does )
// 4. not care if you are not logged in, if the data is present

import { CanoeStore } from "./Interfaces/Store";
import { CanoeCache } from "./Interfaces/Cache";
import { CanoeFetch } from "./Interfaces/Fetch";
import { ResourceGroupDescriptor } from "./Interfaces/ResourceDescriptor";

/**  To be called on every navigation
  @manifestUri
  @locationHash the window.location.hash 
  @store in memory data synchronously accessed state store
  @cache the CacheStorage e.g. window.caches
  @fetch a fetch implementation like WindowOrWorkerGlobalScope.fetch
  @loadingCallback
  @renderCallback

 Responsibilities:
  - get the required data for page rendering either from the state, or the cache  
  - while doing anything asyncronous, communicate that the caller should display loading
  - if anything catastrophic happens, throw an exception to be handled by the caller
  - else communicate to the caller that it can render providing required data */
export async function getDataAndRender(
    manifestUri: string,
    locationHash: string,
    store: CanoeStore,
    cache: CanoeCache,
    fetch: CanoeFetch,
    loadingCallback: (options: Record<string, unknown>) => void,
    renderCallback: (data: Record<string, unknown>) => void
): Promise<void> {
    // try to get the manifest from memory
    const manifest = await getManifest(
        manifestUri,
        store,
        cache,
        fetch,
        loadingCallback
    );

    // we have a manifest so let's find out what data we need
    const resourceGroup = manifest.getResourceGroup(locationHash);

    // get the primary resource
    const primaryResource = await getPrimaryResource(
        resourceGroup,
        store,
        cache,
        fetch,
        loadingCallback
    );

    // render with the required resource data
    renderCallback(primaryResource);
}

/** Gets the manifest either from the store, cache, or network.
 * Updates the store and cache if needed
 */
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
