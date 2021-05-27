import { IPublishableItem } from "../Interfaces/PublishableItemInterfaces";

// See ts/Typings for the type definitions for these imports
import { BACKEND_BASE_URL } from "js/urls";

/** A collection of utility methods for working with manifest, pages and assets in the cache */

/** Get the list of cache keys from the browser
 * @remarks workbox related cache keys are automagically excluded from this list
 */
export const CacheKeys = async (): Promise<string[]> => {
    const keys = await caches.keys();
    return keys.filter((key) => key.indexOf("workbox") === -1);
};

/** Tries to open the cache identified by the cacheKey */
const AccessCache = async (cacheKey: string): Promise<Cache> => {
    return await caches.open(cacheKey);
};

/** Build a request object we can use to fetch the item
 * The item must have a valid `fullUrl`
 */
const BuildRequestObject = (item: IPublishableItem): Request => {
    const headers: any = {
        "Content-Type": item.contentType,
    };
    // Migrate any headers we want from the previous response
    for (const [key, value] of Object.entries(item.respHeaders)) {
        switch (key.toLowerCase()) {
            case "last-modified":
                headers["If-Modified-Since"] = value;
                break;
        }
    }

    const reqInit: any = {
        cache: "no-cache",
        headers: headers,
        method: "GET",
        mode: "cors",
        referrer: BACKEND_BASE_URL,
    };

    return new Request(item.fullUrl, reqInit as RequestInit);
};

/** Cleans the supplied request object and uses it to set the item's requestObject and requestObjectCleaned values */
const CleanRequestObject = (item: IPublishableItem, srcReq: Request): void => {
    if (
        !srcReq.headers.has("authorization") &&
        !srcReq.headers.has("Authorization")
    ) {
        item.requestObjectCleaned = false;
        item.requestObjectClean = true;
        item.requestObject = srcReq;
        return;
    }

    item.requestObjectCleaned = false;
    item.requestObjectClean = false;

    const headers = new Headers();
    for (const key of srcReq.headers.keys()) {
        if (key.toLowerCase() !== "authorization") {
            headers.append(key, srcReq.headers.get(key) || "");
        }
    }

    item.requestObjectCleaned = true;
    item.requestObject = new Request(srcReq.url, {
        body: srcReq.body,
        bodyUsed: srcReq.bodyUsed,
        cache: srcReq.cache,
        destination: srcReq.destination,
        headers: headers,
        integrity: srcReq.integrity,
        method: srcReq.method,
        mode: srcReq.mode,
        redirect: srcReq.redirect,
        referrer: srcReq.referrer,
        referrerPolicy: srcReq.referrerPolicy,
    } as RequestInit);
};

/** Get the Request Object from the currently cached item */
const GetRequestObject = async (
    item: IPublishableItem
): Promise<Request | undefined> => {
    if (!item.fullUrl || item.fullUrl === "/") {
        // "The full url could not be determined for this item, it is not retrievable";
        return Promise.resolve(undefined);
    }

    const itemCache = await AccessCache(item.cacheKey);

    const itemCacheState: Record<string, boolean> = {
        cacheExists: !!itemCache,
        reqObjectLoaded:
            item.isValid &&
            item.requestObject &&
            item.requestObject.url === item.fullUrl,
    };

    if (!itemCacheState.cacheExists) {
        // Couldn't get the cache open (this is a very unusual circumstance)
        if (!itemCacheState.reqObjectLoaded) {
            // And we don't have a pre-existing requestObject we can use
            return Promise.resolve(undefined);
        }
    }

    const requests = await itemCache.keys(item.fullUrl, {
        ignoreMethod: true,
        ignoreSearch: true,
        ignoreVary: true,
    });
    itemCacheState["reqObjectInCache"] = requests.length > 0;

    if (!itemCacheState.reqObjectLoaded) {
        if (!itemCacheState.reqObjectInCache) {
            // `Could not find ${item.fullUrl} within the cache`;
            return Promise.resolve(undefined);
        } else {
            CleanRequestObject(item, item.requestObject);
            return item.requestObject;
        }
    }

    const orderedRequests: Request[] = ([] as Request[]).concat(requests);
    if (orderedRequests.length > 1) {
        // We should really clean the cache in this case
        orderedRequests.sort((a: Request, b: Request) => {
            return a.url < b.url ? 1 : -1;
        });
        orderedRequests.slice(1).forEach((request) => {
            itemCache.delete(request);
        });
    }

    // Note: this is a side-effect behaviour, we try and load the previous
    // response headers from the cache so that we can (potentially) re-use them later
    const response = await itemCache.match(orderedRequests[0]);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    item.SetResponseHeaders(response!.headers);

    CleanRequestObject(item, requests[0]);
    return item.requestObject;
};

/** Get the item from the cache */
const GetFromCache = async (
    item: IPublishableItem
): Promise<Response | undefined> => {
    const itemCache = await AccessCache(item.cacheKey);

    if (!item.requestObject || !itemCache) {
        return undefined;
    }

    return item.requestObject && !!itemCache
        ? await itemCache.match(item.requestObject)
        : undefined;
};

/** Initialise this item from the cache */
export const InitialiseFromCache = async (
    item: IPublishableItem
): Promise<boolean> => {
    const itemCache = await AccessCache(item.cacheKey);
    if (!itemCache || !item.api_url) {
        item.status.cacheStatus = "prepared";
        return false;
    }

    const reqObj = await GetRequestObject(item);
    if (!reqObj) {
        item.status.cacheStatus = "prepared";
        return false;
    }
    const reqUrl = new URL(reqObj.url);
    const params = reqUrl.searchParams;
    const version = parseInt(params.get("version") || "-1");
    item.version = isNaN(version) ? -1 : version;

    item.status.cacheStatus = "loading";
    const response = (await GetFromCache(item))?.clone();

    if (!response) {
        item.status.cacheStatus = "prepared";
        return false;
    }

    const isInitialised = await item.initialiseFromResponse(response);
    item.status.cacheStatus = isInitialised ? "ready" : "loading";

    return isInitialised;
};

/** Initialise this item from a network request */
export const InitialiseByRequest = async (
    item: IPublishableItem
): Promise<boolean> => {
    item.status.cacheStatus = "loading";

    const itemCache = await AccessCache(item.cacheKey);

    if (!itemCache) {
        // Couldn't get the cache open (this is a very unusual circumstance)
        item.status.cacheStatus = "prepared";
        return false;
    }

    let reqObj = await GetRequestObject(item);
    if (!reqObj) {
        item.status.cacheStatus = "prepared";
        if (item.fullUrl && item.fullUrl !== "/") {
            reqObj = BuildRequestObject(item);
            CleanRequestObject(item, reqObj);
        } else {
            // Without a fullUrl we cannot retrieve this item
            // from either the cache or the network
            return false;
        }
    }

    // Fetch the asset from the network, direct into the cache
    try {
        await itemCache.add(reqObj);
    } catch (tex: any) {
        // TypeError if it wasn't `http` or `https`
        // Also:
        // Underlying Response status wasn't 200
        // * request didn't return successfully
        // * request is a cross-origin no-cors request
        //   (in which case the reported status is always 0.)
        // eslint-disable-next-line no-console
        console.error(
            `Error trying to add ${item.cacheKey} for ${item.fullUrl}.`
        );
        // eslint-disable-next-line no-console
        console.error(tex);

        item.status.cacheStatus = "prepared";
        return false;
    }

    const isInitialised = await InitialiseFromCache(item);
    if (isInitialised) {
        item.status.cacheStatus = "ready";
    }

    return isInitialised;
};

/** Updates the item in the cache and ensures it is 'cleaned' ready for publishing */
export const UpdateCachedItem = async (
    item: IPublishableItem
): Promise<boolean> => {
    const itemCache = await AccessCache(item.cacheKey);
    if (!itemCache) {
        item.status.cacheStatus = "prepared";
        return false;
    }

    let reqObj = await GetRequestObject(item);
    if (!reqObj) {
        item.status.cacheStatus = "prepared";
        if (item.fullUrl && item.fullUrl !== "/") {
            reqObj = BuildRequestObject(item);
            CleanRequestObject(item, reqObj);
        } else {
            // Without a fullUrl we cannot retrieve this item
            // from either the cache or the network
            return false;
        }
    }

    item.status.cacheStatus = "loading";

    if (item.requestObjectCleaned) {
        // Delete the existing cache entry first to ensure that the auth key gets 'lost'
        await itemCache.delete(reqObj);
        item.requestObjectCleaned = false;
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await itemCache.put(item.requestObject!, item.updatedResp);
    item.requestObjectClean = true;
    item.status.cacheStatus = "ready";

    return true;
};
