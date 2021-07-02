/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { TBundles } from "../Types/BundleTypes";
import { TSubscriptions } from "../Types/CacheTypes";
import { AppelflapConnect } from "./AppelflapConnect";

export class CacheSubscribe {
    static async getSubscriptions(): Promise<TSubscriptions> {
        if (AppelflapConnect.getInstance()) {
            const subscriptions =
                await AppelflapConnect.getInstance()!.getSubscriptions();
            if (subscriptions.types.CACHE) {
                return subscriptions;
            }
        }
        return { types: { CACHE: { groups: {} } } };
    }

    static async setSubscriptions(
        subscriptions: TSubscriptions
    ): Promise<TSubscriptions> {
        if (AppelflapConnect.getInstance()) {
            return await AppelflapConnect.getInstance()!.setSubscriptions(
                subscriptions
            );
        }
        return { types: { CACHE: { groups: {} } } };
    }

    /**
     * Get a list of all bundles that are 'injectable' into the cache in response to Subscriptions
     */
    static async injectables(): Promise<TBundles> {
        if (AppelflapConnect.getInstance()) {
            return await AppelflapConnect.getInstance()!.injectables();
        }
        return { bundles: [] };
    }
}
