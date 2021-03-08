import { TSubscriptions } from "ts/Types/CacheTypes";

import { AppelflapConnect } from "ts/AppelflapConnect";

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

    async setSubscriptions(
        subscriptions: TSubscriptions
    ): Promise<TSubscriptions> {
        this.#subscriptions = await this.#afc.setSubscriptions(subscriptions);
        return this.#subscriptions;
    }
}
