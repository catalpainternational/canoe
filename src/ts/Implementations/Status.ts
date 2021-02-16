import { TItemCacheStatus, TItemStoreStatus } from "ts/Types/CanoeEnums";
import { TPublishableItemStatus } from "ts/Types/PublishableItemTypes";

import {
    getPublishableItemStatus,
    storePublishableItemStatus,
} from "ts/redux/Interface";

export class Status implements TPublishableItemStatus {
    #id: string;
    #cacheStatus: TItemCacheStatus;
    #storeStatus: TItemStoreStatus;
    #isValid: boolean;
    #isAvailableOffline: boolean;
    #isPublishable: boolean;

    constructor(id: string) {
        this.#id = id;
        this.#cacheStatus = "unset";
        this.#storeStatus = "unset";
        this.#isValid = false;
        this.#isAvailableOffline = false;
        this.#isPublishable = false;

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

    get isValid(): boolean {
        return this.#isValid;
    }

    set isValid(value: boolean) {
        let validity = false;

        if (!this.#id) {
            validity = false;
        } else if (["unset", "empty", "prepared"].includes(this.#cacheStatus)) {
            // This item's cache status is unacceptable
            validity = false;
        } else if (this.#storeStatus !== "ready") {
            // This item's store status is unacceptable
            validity = false;
        } else {
            validity = value;
        }

        if (this.#isValid !== validity) {
            this.#isValid = validity;
            this.StoreStatus();
        }
    }

    get isAvailableOffline(): boolean {
        return this.#isAvailableOffline;
    }

    set isAvailableOffline(value: boolean) {
        let availability = false;

        if (!this.#isValid) {
            availability = false;
        } else if (this.#cacheStatus !== "ready") {
            // This item's cache status is unacceptable
            availability = false;
        } else {
            availability = value;
        }

        if (this.#isAvailableOffline !== availability) {
            this.#isAvailableOffline = availability;
            this.StoreStatus();
        }
    }

    get isPublishable(): boolean {
        return this.#isPublishable;
    }

    set isPublishable(value: boolean) {
        let publishable = false;

        if (!this.#isValid) {
            publishable = false;
        } else if (this.#cacheStatus !== "ready") {
            // This item's cache status is unacceptable
            publishable = false;
        } else {
            publishable = value;
        }

        if (this.#isPublishable !== publishable) {
            this.#isPublishable = publishable;
            this.StoreStatus();
        }
    }

    GetStatusFromStore(): void {
        const status = getPublishableItemStatus(this.id);

        if (status !== null) {
            const itemStatus = status as TPublishableItemStatus;
            this.#cacheStatus = itemStatus.cacheStatus;
            this.#storeStatus = itemStatus.storeStatus;
            this.#isValid = itemStatus.isValid;
            this.#isAvailableOffline = itemStatus.isAvailableOffline;
            this.#isPublishable = itemStatus.isPublishable;
        }
    }

    StoreStatus(): void {
        const status: TPublishableItemStatus = {
            cacheStatus: this.#cacheStatus,
            storeStatus: this.#storeStatus,
            isValid: this.#isValid,
            isAvailableOffline: this.#isAvailableOffline,
            isPublishable: this.#isPublishable,
        };

        storePublishableItemStatus(this.#id, status);
    }

    get emptyStatus(): TPublishableItemStatus {
        return {
            cacheStatus: "unset",
            storeStatus: "unset",
            isValid: false,
            isAvailableOffline: false,
            isPublishable: false,
        };
    }

    get id(): string {
        return this.#id;
    }

    get ready(): boolean {
        return this.#cacheStatus === "ready" && this.#storeStatus === "ready";
    }
}
