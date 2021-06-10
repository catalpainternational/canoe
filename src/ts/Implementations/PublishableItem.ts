import Logger from "../Logger";

// See ts/Typings for the type definitions for these imports
import { BACKEND_BASE_URL } from "js/urls";

export enum UpdatePolicy {
    Default = "default",
    ForceUpdate = "forceUpdate",
    UpdateButStage = "updateButStage",
}

const logger = new Logger("ContentItem");

/** A network backed content item that can be stored and retrieved from a named cache
 * @remarks The item can be queried for cache status and added and removed from the cache
 */
export abstract class PublishableItem {
    /** The api_url of this item as recorded in the manifest */
    abstract get api_url(): string;
    /** The name of the cache used to store this item */
    abstract get cacheKey(): string;
    /** Request options dict used to retrieve this item */
    abstract get requestOptions(): RequestInit;

    /** The (full) url to retrieve this item from */
    get url(): string {
        return this.api_url ? `${BACKEND_BASE_URL}${this.api_url}` : "";
    }

    /** The options used to query the caches for this item */
    get cacheOptions(): MultiCacheQueryOptions {
        return {
            cacheName: this.cacheKey,
            ignoreVary: true,
        };
    }

    getRequestOptions(): RequestInit {
        return Object.assign(
            {
                mode: "cors",
                method: "GET",
            },
            this.requestOptions
        );
    }

    private logMessage(message: string): void {
        logger.log("%s for %s:%s", message, this, this.url);
    }

    /**
     * Get a network response for this item, caching it appropriately
     * @returns a request response for this item
     * @throws Error if network failure or response not OK
     */
    async getResponseFromNetwork(): Promise<Response> {
        this.logMessage("using network");

        let response;
        try {
            response = await fetch(this.url, this.getRequestOptions());
        } catch {
            this.logMessage("request failed");
            throw Error("Network error");
        }

        if (!response.ok) {
            this.logMessage("request not ok");
            throw Error("Network response not ok");
        }

        this.logMessage("caching response");
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
        this.logMessage("checking cache");

        return caches
            .match(this.url, this.cacheOptions)
            .then((cacheResponse) => {
                this.logMessage(
                    cacheResponse === undefined ? "cache miss" : "use cache"
                );
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
        logger.info(
            "Get response for %s:%s using %s",
            this,
            this.url,
            updatePolicy
        );

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
     * @returns `true` if this item is cached in the correct cache, `false` if not
     */
    async isAvailableOffline(): Promise<boolean> {
        const match = await caches.match(this.url, this.cacheOptions);
        return match !== undefined;
    }

    /**
     * Add this item to the correct cache
     * @returns `true` on success
     */
    async makeAvailableOffline(): Promise<boolean> {
        await this.getResponseFromNetwork();
        return true;
    }

    /**
     * Remove this content from the cache
     * @returns `true` on success
     */
    async removeAvailableOffline(): Promise<boolean> {
        const cache = await caches.open(this.cacheKey);
        return await cache.delete(this.url);
    }
}
