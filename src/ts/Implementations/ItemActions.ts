import { TPublication, TSubscriptions } from "../Types/CacheTypes";
import { TAppelflapResult } from "../Types/CanoeEnums";
import { TItemListing } from "../Types/PublishableItemTypes";
import { TPublishableItem } from "../Types/PublishableItemTypes";

import { AppelflapConnect } from "../Appelflap/AppelflapConnect";
import { CachePublish } from "../Appelflap/CachePublish";
import { CacheSubscribe } from "../Appelflap/CacheSubscribe";
import { TBundles } from "../Types/BundleTypes";
import { NOT_RELEVANT } from "../Constants";

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
 * - resolve(NOT_RELEVANT) if appelflap connect wasn't provided,
 * - reject("failed") on error (404 or 500)
 */
export async function getPublications(): Promise<TBundles | string> {
    if (!AppelflapConnect.getInstance()) {
        return Promise.resolve(NOT_RELEVANT);
    }

    try {
        const bundles = await CachePublish.publications();
        return Promise.resolve(bundles);
    } catch (error) {
        return Promise.reject("failed");
    }
}

/** Tells Appelflap to publish this item's cache
 * @returns
 * - resolve("succeeded") on success (200),
 * - resolve(NOT_RELEVANT) if isPublishable is false or appelflap connect wasn't provided,
 * - reject("failed") on error (404 or 500)
 * @remarks Note that there is no `unpublishItem`.
 * Unpublishing (deleting) something published is handled by Appelflap itself.
 */
export async function publishItem(
    item: TPublishableItem
): Promise<TAppelflapResult> {
    if (!item || !item.isPublishable || !AppelflapConnect.getInstance()) {
        return Promise.resolve(NOT_RELEVANT);
    }

    try {
        const result =
            (await CachePublish.publish(CacheTarget(item))) === NOT_RELEVANT
                ? NOT_RELEVANT
                : "succeeded";
        return Promise.resolve(result);
    } catch (error) {
        return Promise.reject("failed");
    }
}

/** Tells Appelflap to retrieve all current subscriptions
 * @returns
 * - resolve("succeeded") on success (200),
 * - resolve(NOT_RELEVANT) if appelflap connect wasn't provided,
 * - reject("failed") on error (404 or 500)
 */
export async function getSubscriptions(): Promise<TSubscriptions | string> {
    if (!AppelflapConnect.getInstance()) {
        return Promise.resolve(NOT_RELEVANT);
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
 * - resolve(NOT_RELEVANT) if no items or appelflap connect wasn't provided,
 * - reject("failed") on error (404 or 500)
 */
export async function setSubscriptions(
    items: TItemListing[]
): Promise<TSubscriptions | string> {
    if (!items || !items.length || !AppelflapConnect.getInstance()) {
        return Promise.resolve(NOT_RELEVANT);
    }

    const subscriptions: TSubscriptions = {
        types: {
            CACHE: {
                groups: {},
            },
        },
    };
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    subscriptions.types.CACHE!.groups[self.origin] = { names: {} };

    const aDay = 24 * 60 * 60 * 1000;

    items.forEach((item) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        subscriptions.types.CACHE!.groups[self.origin].names[item.cacheKey] = {
            injection_version_min: item.version - aDay,
            injection_version_max: item.version + aDay,
            p2p_version_min: item.version - aDay,
            p2p_version_max: item.version + aDay,
            injected_version: item.isPublishable ? item.version : null,
        };
    });

    try {
        console.log("Telling CacheSubscribe to setSubscriptions");

        const result = await CacheSubscribe.setSubscriptions(subscriptions);
        return Promise.resolve(result);
    } catch (error) {
        return Promise.reject("failed");
    }
}
