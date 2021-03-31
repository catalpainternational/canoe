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
    _ownLog(requestUrl, result, location) {
        const resultText = result ? "Got response for" : "No response for";
        const locationText = location ? "found in the caches" : "from the network";
        console.info(`workbox CacheAnyOrFetchOnly: ${resultText} ${requestUrl} ${locationText}`);
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

        // caches.match will return the first match it finds, or undefined
        let response = await caches.match(request.url, this._matchOptions);
        let error;
        if (process.env.NODE_ENV !== "production") {
            this._ownLog(request.url, response, true);
        }        
        if (!response) {
            try {
                response = await handler.fetch(request, this._fetchOptions);
            } catch (err) {
                error = err;
            }

            if (process.env.NODE_ENV !== "production") {
                this._ownLog(request.url, response, false);
            }
        }

        if (!response) {
            throw new Error(`no-response for ${request.url}. ${error}`);
        }
        return response;
    }
}

export { CacheAnyOrFetchOnly };
