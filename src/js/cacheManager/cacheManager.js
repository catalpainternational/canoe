/// CacheManager
// a set of simple functions to easily wrap and expose cache operations

import { BACKEND_BASE_URL } from "../../js/urls";

// requires ignoreVary:true but I am not sure why!
const CACHE_OPTIONS = { ignoreVary: true };

export async function isItemCached(itemUrl) {
    // check if an url is cached ( in any Cache )
    const match = await caches.match(itemUrl, CACHE_OPTIONS);
    return match ? true : false;
}

export async function listCache(cacheName) {
    // get an array of all the urls in a named Cache
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    return keys.map(k => `${BACKEND_BASE_URL}${k.url}`);
}

export async function deleteItemFromCache(itemUrl, cacheName) {
    // deletes an item from a named Cache
    const cache = await caches.open(cacheName);
    return await cache.delete(itemUrl, CACHE_OPTIONS);
}

export async function addToCache(itemUrl, cacheName) {
    // adds an item to a named Cache
    // works for now becasue our media is served with no authentication requirements
    const cache = await caches.open(cacheName);
    return await cache.add(itemUrl);
}

export async function getCachesInfo() {
    // iterates caches returning an array of
    // { name, size, count } for each cache
    const cacheNames = await caches.keys();
    const openCaches = await Promise.all(
        cacheNames.map(cacheName =>
            caches.open(cacheName).then(cache => {
                return [cacheName, cache];
            })
        )
    );
    const cacheDetails = await Promise.all(
        openCaches.map(async cacheInfo => {
            const name = cacheInfo[0];
            const cache = cacheInfo[1];
            const size = await cacheSize(cache);
            const keys = await cache.keys();
            const count = keys.length;
            return { name, size, count };
        })
    );
    return cacheDetails;
}

export async function storageQuota() {
    // get the browser storage estiamte adding a pct used value
    const estimate = await navigator.storage.estimate();
    estimate.pct = (100 * estimate.usage) / estimate.quota;
    return estimate;
}

const cacheSize = async cacheObj => {
    // helper function to estimate size of use in a cache
    // only counts content size, not full request size
    const cacheKeys = await cacheObj.keys();
    const sizeArray = [];

    for (const request of cacheKeys) {
        const result = await cacheObj.match(request);
        const resultBlob = await result.clone().blob();
        sizeArray.push(resultBlob.size);
    }

    const totalBlobSize = sizeArray.reduce(
        (totalBlobSize, aBlobSize) => totalBlobSize + aBlobSize,
        0
    );

    return totalBlobSize;
};
