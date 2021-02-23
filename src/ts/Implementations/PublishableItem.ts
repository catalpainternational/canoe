import { TItemCommon } from "ts/Types/PublishableItemTypes";
import { TManifest } from "ts/Types/ManifestTypes";

import { IPublishableItem } from "ts/Interfaces/PublishableItemInterfaces";

import { StorageStatus } from "ts/Implementations/StorageStatus";

/** A 'Publishable' item is one that is stored in the cache as well as the redux store
 * and which Appelflap can be requested to publish or subscribe to,
 * either directly in the case of the Manifest or Pages,
 * or indirectly in the case of Assets (as part of a Page).
 */
export abstract class PublishableItem<T extends TItemCommon>
    implements IPublishableItem {
    #version: number;
    #id: string;
    #statusId: string;
    data!: T;

    status!: StorageStatus;

    /** A reference to the original manifest itself */
    manifest: TManifest;

    /** The original request object (stripped of any authentication values) that works as the key into the cache */
    #requestObject: Request;
    /** Indicates whether the above #requestObject had to have the authorization header stripped */
    #requestObjectCleaned = false;
    /** Indicates whether the above #requestObject has had the authorization header stripped */
    #requestObjectClean = false;

    constructor(manifest: TManifest, id: string, statusId: string) {
        this.manifest = manifest;
        this.#id = id;
        // Normally statusId will be the same as data.storage_container (the cache name)
        // Except for assets
        this.#statusId = statusId;

        this.#version = -1;
        this.status = new StorageStatus(this.#statusId);
        this.#requestObject = new Request("");

        this.GetDataFromStore();

        if (!this.data) {
            this.data = this.emptyItem;
            this.status.storeStatus = "unset";
        }
    }

    /** Override this in the implementing class to return the correct value */
    get version(): number {
        return this.#version || -1;
    }

    set version(value: number) {
        this.#version = value;
    }

    get api_url(): string {
        return this.data?.api_url || "";
    }

    abstract get fullUrl(): string;

    get emptyItem(): T {
        return ({
            version: -1,
            api_url: "",
            fullUrl: "",
            status: this.status.emptyStatus,
            isValid: false,
            isAvailableOffline: false,
            isPublishable: false,
            contentType: "",
        } as unknown) as T;
    }

    /** The id for this item's data (but not its status) within the redux store (and the manifest) */
    get id(): string {
        return this.#id;
    }

    /** The id for this item's status (but not its data) within the redux store (and normally the cache) */
    get statusId(): string {
        return this.#statusId;
    }

    abstract get contentType(): string;

    /** The data in the manifest that relates specifically to this item */
    abstract get manifestData(): T;

    /** Is this item `ready` to be used now!? */
    get ready(): boolean {
        return this.status.ready;
    }

    get statusIdValid(): boolean {
        return !!this.statusId;
    }

    /** Is the item's cache status acceptable */
    get cacheStatusAcceptable(): boolean {
        return !["unset", "empty", "prepped"].includes(this.status.cacheStatus);
    }

    get storeStatusAcceptable(): boolean {
        return this.status.storeStatus !== "unset";
    }

    /** This will do a basic integrity check. */
    get isValid(): boolean {
        return this.statusIdValid && this.storeStatusAcceptable;
    }

    /** This is only a very basic check.
     * @remarks Implementing classes must call this via super, and extend to meet their requirements. */
    get isAvailableOffline(): boolean {
        return this.isValid && this.cacheStatusAcceptable && this.version >= 0;
    }

    /** This is only a very basic check.
     * @remarks Implementing classes must call this via super, and extend to meet their requirements. */
    get isPublishable(): boolean {
        return (
            this.isValid &&
            this.cacheStatusAcceptable &&
            this.version >= 0 &&
            this.#requestObjectClean
        );
    }

    abstract get cacheKey(): string;

    /** Get the data from the store and use it to fill the `data` member */
    abstract GetDataFromStore(): void;

    abstract StoreDataToStore(): void;

    /** Get the new response to use when updating this item in the cache */
    abstract get updatedResp(): Response;

    get requestObject(): Request {
        return this.#requestObject;
    }

    set requestObject(value: Request) {
        this.#requestObject = value;
    }

    get requestObjectCleaned(): boolean {
        return this.#requestObjectCleaned;
    }

    set requestObjectCleaned(value: boolean) {
        this.#requestObjectCleaned = value;
    }

    get requestObjectClean(): boolean {
        return this.#requestObjectClean;
    }

    set requestObjectClean(value: boolean) {
        this.#requestObjectClean = value;
    }

    /** Initialise this item from a response, either cached or from the network */
    abstract initialiseFromResponse(resp: Response): Promise<boolean>;
}
