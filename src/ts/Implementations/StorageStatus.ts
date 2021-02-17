import { TItemCacheStatus, TItemStoreStatus } from "ts/Types/CanoeEnums";
import { TItemStorageStatus } from "ts/Types/PublishableItemTypes";

import {
    getItemStorageStatus,
    storeItemStorageStatus,
} from "ReduxImpl/Interface";

export class StorageStatus implements TItemStorageStatus {
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
        const status = getItemStorageStatus(this.id);

        if (status !== null) {
            const itemStatus = status as TItemStorageStatus;
            this.#cacheStatus = itemStatus.cacheStatus;
            this.#storeStatus = itemStatus.storeStatus;
        }
    }

    StoreStatus(): void {
        const status: TItemStorageStatus = {
            cacheStatus: this.#cacheStatus,
            storeStatus: this.#storeStatus,
        };

        storeItemStorageStatus(this.#id, status);
    }

    get emptyStatus(): TItemStorageStatus {
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
