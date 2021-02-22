import { TAppelflapResult } from "ts/Types/CanoeEnums";
import { IPublishableItem } from "ts/Interfaces/PublishableItemInterfaces";

import { AppelflapConnect } from "ts/AppelflapConnect";
import { CachePublish } from "ts/CachePublish";
import { CacheSubscribe } from "ts/CacheSubscribe";

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
        await cachePublish.publish(item.cacheTarget);
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
        await cachePublish.unpublish(item.cacheTarget);
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
export async function subscribeItem(
    item: IPublishableItem,
    appelflapConnect: AppelflapConnect
): Promise<TAppelflapResult> {
    if (!item || item.isPublishable || !appelflapConnect) {
        return Promise.resolve("not relevant");
    }

    const cacheSubscribe = new CacheSubscribe(appelflapConnect);

    try {
        await cacheSubscribe.subscribe(item.cacheTarget);
        return await Promise.resolve("succeeded");
    } catch (error) {
        return await Promise.reject("failed");
    }
}

/** Tells Appelflap to unsubscribe for this item
 * @returns
 * - resolve("succeeded") on success (200),
 * - resolve("not relevant") if isPublishable is false or appelflap connect wasn't provided,
 * - reject("failed") on error (404 or 500)
 */
export async function unsubscribeItem(
    item: IPublishableItem,
    appelflapConnect: AppelflapConnect
): Promise<TAppelflapResult> {
    if (!item || !item.isPublishable || !appelflapConnect) {
        return Promise.resolve("not relevant");
    }

    const cacheSubscribe = new CacheSubscribe(appelflapConnect);

    try {
        await cacheSubscribe.unsubscribe(item.cacheTarget);
        return await Promise.resolve("succeeded");
    } catch (error) {
        return await Promise.reject("failed");
    }
}
