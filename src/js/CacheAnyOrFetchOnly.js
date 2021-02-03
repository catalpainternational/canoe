// See https://developers.google.com/web/tools/workbox/guides/using-bundlers
import { Strategy } from "workbox-strategies";

/** This custom strategy first tries to find the request in all caches
 * returning the first result.
 * Or it performs a standard `fetch` and returns the result directly,
 * without caching it at all.
 * It is the responsibility of whatever sent the request to put the response
 * into the correct cache itself.
 */
class CacheAnyOrFetchOnly extends Strategy {
    /**
     * @param {Object} options
     * @param {string} options.cacheName is NOT supported by this strategy. This strategy searches ALL caches.
     * @param {Array<Object>} options.plugins is NOT supported by this strategy.
     * @param {Object} options.fetchOptions Values passed along to the
     * [`init`](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Parameters)
     * of all fetch() requests made by this strategy.
     * @param {Object} options.matchOptions [`MultiCacheQueryOptions`](https://w3c.github.io/ServiceWorker/#dictdef-multicachequeryoptions)
     */
    constructor(options = {}) {
        this._plugins = options.plugins || [];
        this._fetchOptions = options.fetchOptions;
        this._matchOptions = options.matchOptions;
    }

    // _handle is the standard entry point for our logic.
    _handle(request, handler) {
        if (typeof request === "string") {
            request = new Request(request);
        }

        // caches.match will return the first match it finds, or undefined
        const matchDone = caches.match(request, this._matchOptions);
        const fetchDone = handler.fetch(request, this._fetchOptions);

        return new Promise((resolve, reject) => {
            matchDone
                .then((response) => response && resolve(response))
                .catch((_) => {
                    fetchDone.then(resolve).catch(reject);
                });
        });
    }
}

export { CacheAnyOrFetchOnly };
