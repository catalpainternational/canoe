/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { AF_EMPTY_TAGGED_SUBSCRIPTIONS } from "../Constants";
import { TBundles } from "../Types/BundleTypes";
import { TTaggedSubscriptions } from "../Types/CacheTypes";
import { AppelflapConnect } from "./AppelflapConnect";

export class CacheSubscribe {
    static async getSubscriptions(): Promise<TTaggedSubscriptions> {
        if (AppelflapConnect.getInstance()) {
            const taggedSubs =
                await AppelflapConnect.getInstance()!.getSubscriptions();
            if (taggedSubs.subscriptions.types.CACHE) {
                return taggedSubs;
            }
        }
        return AF_EMPTY_TAGGED_SUBSCRIPTIONS;
    }

    static async setSubscriptions(
        taggedSubs: TTaggedSubscriptions
    ): Promise<TTaggedSubscriptions> {
        if (AppelflapConnect.getInstance()) {
            return await AppelflapConnect.getInstance()!.setSubscriptions(
                taggedSubs
            );
        }
        return AF_EMPTY_TAGGED_SUBSCRIPTIONS;
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
