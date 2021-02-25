import { TAppelflapResult } from "ts/Types/CanoeEnums";
import { TPublication } from "ts/Types/CacheTypes";
import { IPublishableItem } from "ts/Interfaces/PublishableItemInterfaces";

import { AppelflapConnect } from "ts/AppelflapConnect";
import { CachePublish } from "ts/CachePublish";
import { CacheSubscribe } from "ts/CacheSubscribe";

/** Define the 'target' within the cache for Appelflap */
const CacheTarget = (item: IPublishableItem): TPublication => {
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
    item: IPublishableItem,
    appelflapConnect: AppelflapConnect
): Promise<TAppelflapResult> {
    if (!item || !item.isPublishable || !appelflapConnect) {
        return Promise.resolve("not relevant");
    }

    const cachePublish = new CachePublish(appelflapConnect);

    try {
        await cachePublish.publish(CacheTarget(item));
        return await Promise.resolve("succeeded");
    } catch (error) {
        return await Promise.reject("failed");
    }
}

/** Tells Appelflap to unpublish this item's cache
 * @returns
 * - resolve("succeeded") on success (200),
 * - resolve("not relevant") if isPublishable is true or appelflap connect wasn't provided,
 * - reject("failed") on error (404 or 500)
 */
export async function unpublishItem(
    item: IPublishableItem,
    appelflapConnect: AppelflapConnect
): Promise<TAppelflapResult> {
    if (!item || item.isPublishable || !appelflapConnect) {
        return Promise.resolve("not relevant");
    }

    const cachePublish = new CachePublish(appelflapConnect);

    try {
        await cachePublish.unpublish(CacheTarget(item));
        return await Promise.resolve("succeeded");
    } catch (error) {
        return await Promise.reject("failed");
    }
}

/** Tells Appelflap to subscribe for this item
 * @returns
 * - resolve("succeeded") on success (200),
 * - resolve("not relevant") if isPublishable is true or appelflap connect wasn't provided,
 * - reject("failed") on error (404 or 500)
 */
// export async function subscribeItem(
//     item: IPublishableItem,
//     appelflapConnect: AppelflapConnect
// ): Promise<TAppelflapResult> {
//     if (!item || item.isPublishable || !appelflapConnect) {
//         return Promise.resolve("not relevant");
//     }

//     const cacheSubscribe = new CacheSubscribe(appelflapConnect);

//     try {
//         await cacheSubscribe.subscribe(CacheTarget(item));
//         return await Promise.resolve("succeeded");
//     } catch (error) {
//         return await Promise.reject("failed");
//     }
// }

/** Tells Appelflap to unsubscribe for this item
 * @returns
 * - resolve("succeeded") on success (200),
 * - resolve("not relevant") if isPublishable is false or appelflap connect wasn't provided,
 * - reject("failed") on error (404 or 500)
 */
// export async function unsubscribeItem(
//     item: IPublishableItem,
//     appelflapConnect: AppelflapConnect
// ): Promise<TAppelflapResult> {
//     if (!item || !item.isPublishable || !appelflapConnect) {
//         return Promise.resolve("not relevant");
//     }

//     const cacheSubscribe = new CacheSubscribe(appelflapConnect);

//     try {
//         await cacheSubscribe.unsubscribe(CacheTarget(item));
//         return await Promise.resolve("succeeded");
//     } catch (error) {
//         return await Promise.reject("failed");
//     }
// }
