/* eslint-disable @typescript-eslint/no-non-null-assertion */
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
}
