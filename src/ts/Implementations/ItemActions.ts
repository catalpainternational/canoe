import { TPublication, TSubscriptions } from "../Types/CacheTypes";
import { TAppelflapResult } from "../Types/CanoeEnums";
import { TItemListing } from "../Types/PublishableItemTypes";
import { TPublishableItem } from "../Types/PublishableItemTypes";

import { AppelflapConnect } from "../Appelflap/AppelflapConnect";
import { CachePublish } from "../Appelflap/CachePublish";
import { CacheSubscribe } from "../Appelflap/CacheSubscribe";

/** Define the 'target' within the cache for Appelflap */
const CacheTarget = (item: TPublishableItem): TPublication => {
    return {
        webOrigin: btoa(self.origin),
        cacheName: btoa(item.cacheKey),
        version: item.version,
    };
};

/** Tells Appelflap to publish this item's cache
 * @returns
 * - resolve("succeeded") on success (200),
 * - resolve("not relevant") if isPublishable is false or appelflap connect wasn't provided,
 * - reject("failed") on error (404 or 500)
 */
export async function publishItem(
    item: TPublishableItem,
    appelflapConnect: AppelflapConnect
): Promise<TAppelflapResult> {
    if (!item || !item.isPublishable || !appelflapConnect) {
        return Promise.resolve("not relevant");
    }

    const cachePublish = new CachePublish(appelflapConnect);

    try {
        await cachePublish.publish(CacheTarget(item));
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
    item: TPublishableItem,
    appelflapConnect: AppelflapConnect
): Promise<TAppelflapResult> {
    if (!item || item.isPublishable || !appelflapConnect) {
        return Promise.resolve("not relevant");
    }

    const cachePublish = new CachePublish(appelflapConnect);

    try {
        await cachePublish.unpublish(CacheTarget(item));
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
export async function getSubscriptions(
    appelflapConnect: AppelflapConnect
): Promise<TSubscriptions | string> {
    if (!appelflapConnect) {
        return Promise.resolve("not relevant");
    }

    const cacheSubscribe = new CacheSubscribe(appelflapConnect);

    try {
        const subscriptions = await cacheSubscribe.getSubscriptions();
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
    items: TItemListing[],
    appelflapConnect: AppelflapConnect
): Promise<TSubscriptions | string> {
    if (
        !items ||
        !items.length ||
        !items.some((item) => !item.isPublishable) ||
        !appelflapConnect
    ) {
        return Promise.resolve("not relevant");
    }

    const cacheSubscribe = new CacheSubscribe(appelflapConnect);

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
        const result = await cacheSubscribe.setSubscriptions(subscriptions);
        return Promise.resolve(result);
    } catch (error) {
        return Promise.reject("failed");
    }
}
