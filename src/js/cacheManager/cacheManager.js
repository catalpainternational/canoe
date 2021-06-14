/// CacheManager
// a set of simple functions to easily wrap and expose cache operations

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
