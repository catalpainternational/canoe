import {
    TPublication,
    TPublications,
    TSubscriptions,
} from "../Types/CacheTypes";
import { TAppelflapResult } from "../Types/CanoeEnums";
import { TItemListing } from "../Types/PublishableItemTypes";
import { TPublishableItem } from "../Types/PublishableItemTypes";

import { AppelflapConnect } from "../Appelflap/AppelflapConnect";
import { CachePublish } from "../Appelflap/CachePublish";
import { CacheSubscribe } from "../Appelflap/CacheSubscribe";

/** Define the 'target' within the cache for Appelflap */
const CacheTarget = (item: TPublishableItem): TPublication => {
    return {
        bundleType: "CACHE",
        webOrigin: btoa(self.origin),
        cacheName: btoa(item.cacheKey),
        version: item.version,
    };
};

/** Asks Appelflap to identify all caches that it is currently publishing
 * @returns
 * - resolve("succeeded") on success (200),
 * - resolve("not relevant") if appelflap connect wasn't provided,
 * - reject("failed") on error (404 or 500)
 */
export async function getPublications(
    item: TPublishableItem
): Promise<TPublications | string> {
    if (!AppelflapConnect.Instance) {
        return Promise.resolve("not relevant");
    }

    try {
        const publications = await CachePublish.publications();
        return Promise.resolve(publications);
    } catch (error) {
        return Promise.reject("failed");
    }
}

/** Tells Appelflap to publish this item's cache
 * @returns
 * - resolve("succeeded") on success (200),
 * - resolve("not relevant") if isPublishable is false or appelflap connect wasn't provided,
 * - reject("failed") on error (404 or 500)
 */
export async function publishItem(
    item: TPublishableItem
): Promise<TAppelflapResult> {
    if (!item || !item.isPublishable || !AppelflapConnect.getInstance()) {
        return Promise.resolve("not relevant");
    }

    try {
        await CachePublish.publish(CacheTarget(item));
        return Promise.resolve("succeeded");
    } catch (error) {
        return Promise.reject("failed");
    }
}

/** Tells Appelflap to unpublish this item's cache
 * @returns
 * - resolve("succeeded") on success (200),
 * - resolve("not relevant") if isPublishable is true or appelflap connect wasn't provided,
 * - reject("failed") on error (404 or 500)
 */
export async function unpublishItem(
    item: TPublishableItem
): Promise<TAppelflapResult> {
    if (!item || item.isPublishable || !AppelflapConnect.getInstance()) {
        return Promise.resolve("not relevant");
    }

    try {
        await CachePublish.unpublish(CacheTarget(item));
        return Promise.resolve("succeeded");
    } catch (error) {
        return Promise.reject("failed");
    }
}

/** Tells Appelflap to retrieve all current subscriptions
 * @returns
 * - resolve("succeeded") on success (200),
 * - resolve("not relevant") if appelflap connect wasn't provided,
 * - reject("failed") on error (404 or 500)
 */
export async function getSubscriptions(): Promise<TSubscriptions | string> {
    if (!AppelflapConnect.getInstance()) {
        return Promise.resolve("not relevant");
    }

    try {
        const subscriptions = await CacheSubscribe.getSubscriptions();
        return Promise.resolve(subscriptions);
    } catch (error) {
        return Promise.reject("failed");
    }
}

/** Tells Appelflap to set all current subscriptions
 * @returns
 * - resolve("succeeded") on success (200),
 * - resolve("not relevant") if no items, none of the items are publishable, or appelflap connect wasn't provided,
 * - reject("failed") on error (404 or 500)
 */
export async function setSubscriptions(
    items: TItemListing[]
): Promise<TSubscriptions | string> {
    if (
        !items ||
        !items.length ||
        !items.some((item) => !item.isPublishable) ||
        !AppelflapConnect.getInstance()
    ) {
        return Promise.resolve("not relevant");
    }

    const subscriptions: TSubscriptions = {
        origins: {},
    };

    subscriptions.origins[self.origin] = { caches: {} };

    items.forEach((item) => {
        subscriptions.origins[self.origin].caches[item.cacheKey] = {
            injection_version_min: item.version,
            injection_version_max: item.version,
            p2p_version_min: item.version,
            p2p_version_max: item.version,
            injected_version: item.isPublishable ? item.version : null,
        };
    });

    try {
        const result = await CacheSubscribe.setSubscriptions(subscriptions);
        return Promise.resolve(result);
    } catch (error) {
        return Promise.reject("failed");
    }
}
