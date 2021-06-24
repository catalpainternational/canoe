/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { TSubscriptions } from "../Types/CacheTypes";
import { AppelflapConnect } from "./AppelflapConnect";

export class CacheSubscribe {
    static async getSubscriptions(): Promise<TSubscriptions> {
        if (AppelflapConnect.getInstance()) {
            return await AppelflapConnect.getInstance()!.getSubscriptions();
        }
        return { origins: {} };
    }

    static async setSubscriptions(
        subscriptions: TSubscriptions
    ): Promise<TSubscriptions> {
        if (AppelflapConnect.getInstance()) {
            return await AppelflapConnect.getInstance()!.setSubscriptions(
                subscriptions
            );
        }
        return { origins: {} };
    }
}
