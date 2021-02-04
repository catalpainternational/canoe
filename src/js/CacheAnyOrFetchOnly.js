// See https://developers.google.com/web/tools/workbox/guides/using-bundlers
import { Strategy } from "workbox-strategies";
import { assert, logger, WorkboxError } from "workbox-core";


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

    /**
     * @private
     * @param {Request|string} request A request to run this strategy for.
     * @param {module:workbox-strategies.StrategyHandler} handler The event that
     *     triggered the request.
     * @return {Promise<Response>}
     */
    async _handle(request, handler) {
        const logs = [];
        if (typeof request === "string") {
            request = new Request(request);
        }
        if (process.env.NODE_ENV !== "production") {
            assert.isInstance(request, Request, {
                moduleName: "workbox-strategies",
                className: this.constructor.name,
                funcName: "makeRequest",
                paramName: "request",
            });
        }        

        // caches.match will return the first match it finds, or undefined
        let response = await caches.match(request, this._matchOptions);
        let error;
        if (!response) {
            if (process.env.NODE_ENV !== "production") {
                logs.push("No response found in the caches.  Will respond with a network request.");
            }            

            try {
                response = await handler.fetch(request, this._fetchOptions);
            } catch (err) {
                error = err;
            }

            if (process.env.NODE_ENV !== "production") {
                if (response) {
                    logs.push("Got response from network.");
                }
                else {
                    logs.push("Unable to get a response from the network.");
                }
            }
        } else {
            if (process.env.NODE_ENV !== "production") {
                logs.push("Found a cached response in the caches.");
            }
        }

        if (process.env.NODE_ENV !== "production") {
            logger.groupCollapsed(`Using ${this.constructor.name} to respond to '${request.url}'`);
            for (const log of logs) {
                logger.log(log);
            }
            if (response) {
                logger.groupCollapsed("View the final response here.");
                logger.log(response);
                logger.groupEnd();
            } else {
                logger.log("[No response returned]");
            }
            logger.groupEnd();
        }
        if (!response) {
            throw new WorkboxError("no-response", { url: request.url, error });
        }
        return response;
    }
}

export { CacheAnyOrFetchOnly };
