import { IPublishableItem } from "ts/Interfaces/PublishableItemInterfaces";

import { AppelflapConnect } from "ts/AppelflapConnect";
import { CachePublish } from "ts/CachePublish";
import { CacheSubscribe } from "ts/CacheSubscribe";

/** Tells Appelflap to publish this item's cache
 * @returns
 * - resolve(true) on success,
 * - resolve(false) if isPublishable is false or appelflap connect wasn't provided,
 * - reject(false) on error
 */
export async function publishItem(
    item: IPublishableItem,
    appelflapConnect: AppelflapConnect
): Promise<boolean> {
    if (!item || !item.isPublishable || !appelflapConnect) {
        return Promise.resolve(false);
    }

    const cachePublish = new CachePublish(appelflapConnect);

    try {
        await cachePublish.publish(item.cacheTarget);
        return await Promise.resolve(true);
    } catch (error) {
        return await Promise.reject(false);
    }
}

/** Tells Appelflap to unpublish this item's cache
 * @returns
 * - resolve(true) on success,
 * - resolve(false) if isPublishable is true or appelflap connect wasn't provided,
 * - reject(false) on error
 */
export async function unpublishItem(
    item: IPublishableItem,
    appelflapConnect: AppelflapConnect
): Promise<boolean> {
    if (!item || item.isPublishable || !appelflapConnect) {
        return Promise.resolve(false);
    }

    const cachePublish = new CachePublish(appelflapConnect);

    try {
        await cachePublish.unpublish(item.cacheTarget);
        return await Promise.resolve(true);
    } catch (error) {
        return await Promise.reject(false);
    }
}

/** Tells Appelflap to subscribe for this item
 * @returns
 * - resolve(true) on success,
 * - resolve(false) if isPublishable is true or appelflap connect wasn't provided,
 * - reject(false) on error
 */
export async function subscribeItem(
    item: IPublishableItem,
    appelflapConnect: AppelflapConnect
): Promise<boolean> {
    if (!item || item.isPublishable || !appelflapConnect) {
        return Promise.resolve(false);
    }

    const cacheSubscribe = new CacheSubscribe(appelflapConnect);

    try {
        await cacheSubscribe.subscribe(item.cacheTarget);
        return await Promise.resolve(true);
    } catch (error) {
        return await Promise.reject(false);
    }
}

/** Tells Appelflap to unsubscribe for this item
 * @returns
 * - resolve(true) on success,
 * - resolve(false) if isPublishable is false or appelflap connect wasn't provided,
 * - reject(false) on error
 */
export async function unsubscribeItem(
    item: IPublishableItem,
    appelflapConnect: AppelflapConnect
): Promise<boolean> {
    if (!item || !item.isPublishable || !appelflapConnect) {
        return Promise.resolve(false);
    }

    const cacheSubscribe = new CacheSubscribe(appelflapConnect);

    try {
        await cacheSubscribe.unsubscribe(item.cacheTarget);
        return await Promise.resolve(true);
    } catch (error) {
        return await Promise.reject(false);
    }
}
