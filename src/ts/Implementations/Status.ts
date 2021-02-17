import { TItemCacheStatus, TItemStoreStatus } from "ts/Types/CanoeEnums";
import { TPublishableItemStatus } from "ts/Types/PublishableItemTypes";

import {
    getPublishableItemStatus,
    storePublishableItemStatus,
} from "ReduxImpl/Interface";

export class Status implements TPublishableItemStatus {
    #id: string;
    #cacheStatus: TItemCacheStatus;
    #storeStatus: TItemStoreStatus;

    constructor(id: string) {
        this.#id = id;
        this.#cacheStatus = "unset";
        this.#storeStatus = "unset";

        this.GetStatusFromStore();
    }

    get cacheStatus(): TItemCacheStatus {
        return this.#cacheStatus;
    }

    set cacheStatus(value: TItemCacheStatus) {
        if (this.#cacheStatus !== value) {
            this.#cacheStatus = value;
            this.StoreStatus();
        }
    }

    get storeStatus(): TItemStoreStatus {
        return this.#storeStatus;
    }

    set storeStatus(value: TItemStoreStatus) {
        if (this.#storeStatus !== value) {
            this.#storeStatus = value;
            this.StoreStatus();
        }
    }

    GetStatusFromStore(): void {
        const status = getPublishableItemStatus(this.id);

        if (status !== null) {
            const itemStatus = status as TPublishableItemStatus;
            this.#cacheStatus = itemStatus.cacheStatus;
            this.#storeStatus = itemStatus.storeStatus;
        }
    }

    StoreStatus(): void {
        const status: TPublishableItemStatus = {
            cacheStatus: this.#cacheStatus,
            storeStatus: this.#storeStatus,
        };

        storePublishableItemStatus(this.#id, status);
    }

    get emptyStatus(): TPublishableItemStatus {
        return {
            cacheStatus: "unset",
            storeStatus: "unset",
        };
    }

    get id(): string {
        return this.#id;
    }

    get ready(): boolean {
        return this.#cacheStatus === "ready" && this.#storeStatus === "ready";
    }
}
