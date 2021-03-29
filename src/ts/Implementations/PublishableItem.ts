import Logger from "../Logger";

export enum UpdatePolicy {
    Default = "default",
    ForceUpdate = "forceUpdate",
    UpdateButStage = "updateButStage",
}

const logger = new Logger("ContentItem");

/** A network backed content item that can be stored and retrieved from a named cache
 * The item can be queeried for cache status and added and remove from the cache
 */
export abstract class PublishableItem {
    /** the url to retrieve this item from */
    abstract get url(): string;
    /** the name of the cahche used to store this */
    abstract get cacheKey(): string;
    /** Request options dict used to retrieve this item */
    abstract get requestOptions(): any;
    /** Brief descriptive string for logs */
    abstract get str(): string;

    /**
     * Get a network response for this item, caching it appropriately
     * @returns a request response for this item
     * @throws Error if network failure or response not OK
     */
    async getResponseFromNetwork(): Promise<Response> {
        logger.log("using network for %s:%s", this.str, this.url);
        let response;
        try {
            response = await fetch(this.url, this.requestOptions);
        } catch {
            logger.warn("request failed for %s:%s", this.str, this.url);
            throw Error("Network error");
        }
        if (!response.ok) {
            logger.warn("request not ok for %s:%s", this.str, this.url);
            throw Error("Network response not ok");
        }
        logger.log("caching response for %s:%s", this.str, this.url);
        const responseClone = response.clone();
        await caches
            .open(this.cacheKey)
            .then((c) => c.put(this.url, responseClone));
        return response;
    }

    /**
     * Get a response from the cache for this item
     * @returns a response for this item or undefined if not found
     * @throws Error if network used and failure or response not OK
     */
    async getResponseFromCache(): Promise<Response | undefined> {
        logger.log("checking cache for %s:%s", this.str, this.url);
        return caches
            .match(this.url, this.requestOptions)
            .then((cacheResponse) => {
                if (cacheResponse === undefined) {
                    logger.log("Cache miss for %s:%s", this.str, this.url);
                } else {
                    logger.log("Use cache for %s:%s", this.str, this.url);
                }
                return cacheResponse;
            });
    }

    /**
     * Gets a response from this item either from the cache or network
     * @param updatePolicy Default to check cache the network
     *  Force to use network only
     * @returns a response for this item
     * @throws Error if network used and failure or response not OK, or strategy not handled
     */
    async getResponse(
        updatePolicy: UpdatePolicy = UpdatePolicy.Default
    ): Promise<Response> {
        logger.info("Get response for %s:%s using %s", this.str, updatePolicy);
        let response: Response;
        switch (updatePolicy) {
            case UpdatePolicy.Default:
                response = await this.getResponseFromCache().then(
                    (cacheResponse) => {
                        // always hit the network
                        const networkResponse = this.getResponseFromNetwork();
                        // but return from cache first
                        // network will update cache in the background
                        return cacheResponse || networkResponse;
                    }
                );
                break;
            case UpdatePolicy.ForceUpdate:
                response = await this.getResponseFromNetwork();
                break;
            default:
                throw Error("Unhandled prepare strategy");
        }
        return response;
    }

    /**
     * Check if the item is in the correct cache
     * @returns true if this item is cached in the correct cache , false if not
     */
    isAvailableOffline(): Promise<boolean> {
        return caches
            .match(this.url, { cacheName: this.cacheKey })
            .then((match) => {
                return match !== undefined;
            });
    }
    /**
     * Add this item to the correct cache
     * @returns true if succeeds
     */
    makeAvailableOffline(): Promise<boolean> {
        return this.getResponseFromNetwork().then(() => true);
    }
    /**
     * Remove this content from the cache
     * @returns true if succeds
     */
    removeAvailableOffline(): Promise<boolean> {
        return caches
            .open(this.cacheKey)
            .then((cache) => cache.delete(this.url));
    }
}
