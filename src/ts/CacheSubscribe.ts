import { AppelflapConnect } from "./AppelflapConnect";
import {
    TPublicationTarget,
    TSubscription,
    TSubscriptions,
} from "./Types/CacheTypes";

export class CacheSubscribe {
    #subscriptions: TSubscriptions = { origins: {} };
    #afc: AppelflapConnect;

    constructor(afc: AppelflapConnect) {
        this.#afc = afc;
    }

    async getSubscriptions(): Promise<TSubscriptions> {
        this.#subscriptions = await this.#afc.getSubscriptions();
        return this.#subscriptions;
    }

    async setSubscriptions(subscriptions: TSubscriptions): Promise<string> {
        this.#subscriptions = subscriptions;

        const result = await this.#afc.setSubscriptions(subscriptions);

        return result;
    }

    // /** Adds a single subscription to the existing list of subscriptions */
    // subscribe = async (subscription: TSubscription): Promise<void> => {
    //     this.#subscriptions[subscription.webOrigin] =
    //         this.#subscriptions[subscription.webOrigin] || {};
    //     this.#subscriptions[subscription.webOrigin][subscription.cacheName] =
    //         this.#subscriptions[subscription.webOrigin][
    //             subscription.cacheName
    //         ] || {};

    //     await this.#afc.subscribe(subscription);
    // };

    // /** Deletes a single subscription from the existing list of subscriptions */
    // unsubscribe = async (subscription: TPublicationTarget): Promise<void> => {
    //     if (
    //         this.#subscriptions[subscription.webOrigin]?.[
    //             subscription.cacheName
    //         ]
    //     ) {
    //         delete this.#subscriptions[subscription.webOrigin][
    //             subscription.cacheName
    //         ];
    //     }
    //     if (
    //         this.#subscriptions[subscription.webOrigin] &&
    //         JSON.stringify(this.#subscriptions[subscription.webOrigin]) === "{}"
    //     ) {
    //         delete this.#subscriptions[subscription.webOrigin];
    //     }

    //     await this.#afc.unsubscribe(subscription);
    // };
}
