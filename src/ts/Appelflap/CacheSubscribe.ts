import { TSubscriptions } from "../Types/CacheTypes";
import { AppelflapConnect } from "./AppelflapConnect";

export class CacheSubscribe {
    static async getSubscriptions(): Promise<TSubscriptions> {
        if (AppelflapConnect.Instance) {
            return await AppelflapConnect.Instance.getSubscriptions();
        }
        return { origins: {} };
    }

    static async setSubscriptions(
        subscriptions: TSubscriptions
    ): Promise<TSubscriptions> {
        if (AppelflapConnect.Instance) {
            return await AppelflapConnect.Instance.setSubscriptions(
                subscriptions
            );
        }
        return { origins: {} };
    }
}
