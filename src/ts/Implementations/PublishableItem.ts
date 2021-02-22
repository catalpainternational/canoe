import { BACKEND_BASE_URL } from "js/urls";

import { TItemCommon } from "ts/Types/PublishableItemTypes";
import { TManifest } from "ts/Types/ManifestTypes";
import { TPublication } from "ts/Types/CacheTypes";

import { IPublishableItem } from "ts/Interfaces/PublishableItemInterfaces";

import { StorageStatus } from "src/ts/Implementations/StorageStatus";

// See ts/Typings for the type definitions for these imports
import { getAuthenticationToken } from "js/AuthenticationUtilities";

export abstract class PublishableItem<T extends TItemCommon>
    implements IPublishableItem {
    #version: number;
    #id: string;
    #statusId: string;
    data!: T;
    cache!: Cache;

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
     * Implementing classes must call this via super, and extend to meet their requirements. */
    get isAvailableOffline(): boolean {
        return this.isValid && this.cacheStatusAcceptable && this.version >= 0;
    }

    /** This is only a very basic check.
     * Implementing classes must call this via super, and extend to meet their requirements. */
    get isPublishable(): boolean {
        return (
            this.isValid &&
            this.cacheStatusAcceptable &&
            this.version >= 0 &&
            this.#requestObjectClean
        );
    }

    abstract get cacheKey(): string;

    /** Returns the opened cache or tries to open it */
    async accessCache(): Promise<boolean> {
        if (!this.cache) {
            this.cache = await caches.open(this.cacheKey);
        }

        return !!this.cache;
    }

    /** Get the data from the store and use it to fill the `data` member */
    abstract GetDataFromStore(): void;

    abstract StoreDataToStore(): void;

    /** Build a request object we can use to fetch this item */
    private get NewRequestObject(): Request {
        const headers: any = {
            "Content-Type": this.contentType,
        };
        const token = getAuthenticationToken();
        if (token) {
            headers["Authorization"] = `JWT ${token}`;
        }

        const reqInit: any = {
            cache: "no-cache",
            headers: headers,
            method: "GET",
            mode: "cors",
            referrer: BACKEND_BASE_URL,
        };

        return new Request(this.fullUrl, reqInit as RequestInit);
    }

    /** Create the new response to go into the cache */
    abstract get updatedResp(): Response;

    /** Define the 'target' within the cache for Appelflap */
    get cacheTarget(): TPublication {
        return {
            webOrigin: btoa(self.origin),
            cacheName: btoa(this.cacheKey),
            version: this.version,
        };
    }

    /** Cleans the supplied request object and uses it to set this item's #requestObject and #requestObjectCleaned values */
    private CleanRequestObject(srcReq: Request): void {
        if (!srcReq.headers.has("authorization")) {
            this.#requestObjectCleaned = false;
            this.#requestObjectClean = true;
            this.#requestObject = srcReq;
            return;
        }

        this.#requestObjectCleaned = false;
        this.#requestObjectClean = false;

        const headers = new Headers();
        for (const key of srcReq.headers.keys()) {
            if (key !== "authorization") {
                headers.append(key, srcReq.headers.get(key) || "");
            }
        }

        this.#requestObjectCleaned = true;
        this.#requestObject = new Request(srcReq.url, {
            body: srcReq.body,
            bodyUsed: srcReq.bodyUsed,
            cache: srcReq.cache,
            destination: srcReq.destination,
            headers: headers,
            integrity: srcReq.integrity,
            method: srcReq.method,
            mode: srcReq.mode,
            redirect: srcReq.redirect,
            referrer: srcReq.referrer,
            referrerPolicy: srcReq.referrerPolicy,
        } as RequestInit);
    }

    /** Get the Request Object from the currently cached item */
    private async GetRequestObject(): Promise<Request | undefined> {
        const cacheOpen = await this.accessCache();

        if (!this.fullUrl) {
            // "The full url could not be determined for this item, it is not retrievable";
            return Promise.resolve(undefined);
        }
        if (this.#requestObject && this.#requestObject.url === this.fullUrl) {
            this.CleanRequestObject(this.#requestObject);
            return this.#requestObject;
        }

        if (!cacheOpen) {
            // Couldn't get the cache open (this is a very unusual circumstance)
            return Promise.resolve(undefined);
        }

        const requests = await this.cache.keys(this.fullUrl, {
            ignoreMethod: true,
            ignoreSearch: true,
            ignoreVary: true,
        });
        if (requests.length === 0) {
            // `Could not find ${this.fullUrl} in the cache`;
            return Promise.resolve(undefined);
        }

        if (requests.length > 1) {
            // We should really clean the cache in this case
            // But we still don't know how to do that properly
            // requests.slice(1).forEach((request) => {
            //     this.cache.delete(request);
            // });
        }

        this.CleanRequestObject(requests[0]);
        return this.#requestObject;
    }

    private async getFromCache(): Promise<Response | undefined> {
        const cacheOpen = await this.accessCache();

        return this.#requestObject && cacheOpen
            ? await this.cache.match(this.#requestObject)
            : undefined;
    }

    /** Updates the cache and ensures it is 'cleaned' ready for publishing */
    async updateCache(): Promise<boolean> {
        if (!(await this.accessCache())) {
            this.status.cacheStatus = "prepared";
            return false;
        }

        let reqObj = await this.GetRequestObject();
        if (!reqObj) {
            this.status.cacheStatus = "prepared";
            if (this.fullUrl) {
                reqObj = this.NewRequestObject;
                this.CleanRequestObject(reqObj);
            } else {
                // Without a fullUrl we cannot retrieve this item
                // from either the cache or the network
                return false;
            }
        }

        this.status.cacheStatus = "loading";

        if (this.#requestObjectCleaned) {
            // Delete the existing cache entry first to ensure that the auth key gets 'lost'
            await this.cache.delete(reqObj);
            this.#requestObjectCleaned = false;
        }

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        await this.cache.put(this.#requestObject!, this.updatedResp);
        this.#requestObjectClean = true;
        this.status.cacheStatus = "ready";

        return true;
    }

    /** Initialise this item from a response, either cached or from the network */
    abstract initialiseFromResponse(resp: Response): Promise<boolean>;

    /** Initialise this item from the cache */
    async initialiseFromCache(): Promise<boolean> {
        const cacheOpen = await this.accessCache();
        if (!cacheOpen || !this.api_url) {
            this.status.cacheStatus = "prepared";
            return false;
        }

        const reqObj = await this.GetRequestObject();
        if (!reqObj) {
            this.status.cacheStatus = "prepared";
            return false;
        }
        const reqUrl = new URL(reqObj.url);
        const params = reqUrl.searchParams;
        const version = parseInt(params.get("version") || "-1");
        this.#version = isNaN(version) ? -1 : version;

        this.status.cacheStatus = "loading";
        const response = (await this.getFromCache())?.clone();

        if (!response) {
            this.status.cacheStatus = "prepared";
            return false;
        }

        const isInitialised = await this.initialiseFromResponse(response);
        this.status.cacheStatus = isInitialised ? "ready" : "loading";

        return isInitialised;
    }

    /** Initialise this item from a network request */
    async initialiseByRequest(): Promise<boolean> {
        this.status.cacheStatus = "loading";

        const cacheOpen = await this.accessCache();

        const reqObj = this.NewRequestObject;
        this.CleanRequestObject(reqObj);

        if (!cacheOpen) {
            // Couldn't get the cache open (this is a very unusual circumstance)
            this.status.cacheStatus = "prepared";
            return false;
        }

        // Fetch the asset from the network, direct into the cache
        try {
            await this.cache.add(reqObj);
        } catch (tex: any) {
            // TypeError if it wasn't `http` or `https`
            // Also:
            // Underlying Response status wasn't 200
            // * request didn't return successfully
            // * request is a cross-origin no-cors request
            //   (in which case the reported status is always 0.)
            // eslint-disable-next-line no-console
            console.error(tex);

            this.status.cacheStatus = "prepared";
            return false;
        }

        const isInitialised = await this.initialiseFromCache();
        if (isInitialised) {
            this.status.cacheStatus = "ready";
        }

        return isInitialised;
    }
}
