import { BACKEND_BASE_URL } from "js/urls";

import {
    TPublishableItem,
    TPublishableItemStatus,
} from "ts/Types/PublishableItemTypes";
import { TManifest } from "ts/Types/ManifestTypes";

import { IPublishableItemState } from "ts/Interfaces/PublishableItemInterfaces";

import { getPublishableItemStatus } from "ts/redux/Interface";

import { AppelflapConnect } from "ts/AppelflapConnect";
import { CachePublish } from "ts/CachePublish";

// See ts/Typings for the type definitions for these imports
import { getAuthenticationToken } from "js/AuthenticationUtilities";

export abstract class PublishableItem<T extends TPublishableItem>
    implements IPublishableItemState {
    #version: number;
    #id: string;
    data!: T;
    cache!: Cache;

    status!: TPublishableItemStatus;

    /** A reference to the original manifest itself */
    manifest: TManifest;

    /** The original request object (stripped of any authentication values) that works as the key into the cache */
    #requestObject: Request;
    /** Indicates whether the above #requestObject had to have the authorization header stripped */
    #requestObjectCleaned = false;
    /** Indicates whether the above #requestObject has had the authorization header stripped */
    #requestObjectClean = false;

    constructor(manifest: TManifest, id: string) {
        this.status = {
            cacheStatus: "unset",
            storeStatus: "unset",
            isValid: false,
            isAvailableOffline: false,
            isPublishable: false,
        };
        this.#version = -1;
        this.#requestObject = new Request("");

        this.#id = id;
        this.manifest = manifest;

        if (!this.data) {
            this.data = this.emptyItem;
            this.status.cacheStatus = "empty";
        }

        this.GetStateFromStore();
        this.GetDataFromStore();
    }

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
            status: {
                cacheStatus: "unset",
                storeStatus: "unset",
                isValid: false,
                isAvailableOffline: false,
                isPublishable: false,
            },
            contentType: "",
        } as unknown) as T;
    }

    get id(): string {
        return this.#id;
    }

    abstract get contentType(): string;

    /** The data in the manifest that relates specifically to this item */
    abstract get manifestData(): T;

    get ready(): boolean {
        return !!this.status.cacheStatus && this.status.cacheStatus === "ready";
    }

    /** This will do a basic integrity check. */
    get isValid(): boolean {
        if (!this.api_url) {
            return false;
        }

        // Is the item's status acceptable
        if (["unset", "empty", "prepared"].includes(this.status.cacheStatus)) {
            return false;
        }

        return true;
    }

    /** This is only a very basic check.
     * Implementing classes must call this via super, and extend to meet their requirements. */
    get isAvailableOffline(): boolean {
        if (!this.isValid) {
            return false;
        }

        if (this.version < 0) {
            return false;
        }

        // Is the item's status acceptable
        return this.status.cacheStatus === "ready";
    }

    /** This is only a very basic check.
     * Implementing classes must call this via super, and extend to meet their requirements. */
    get isPublishable(): boolean {
        if (!this.isValid) {
            return false;
        }

        if (this.version < 0) {
            return false;
        }

        // Has the item's cache entry and its request header cleaned of auth data
        if (!this.#requestObjectClean) {
            return false;
        }

        // Is the items's status acceptable
        return this.status.cacheStatus === "ready";
    }

    abstract get cacheKey(): string;

    /** Returns the opened cache or tries to open it */
    async accessCache(): Promise<boolean> {
        if (!this.cache) {
            this.cache = await caches.open(this.cacheKey);
        }

        return !!this.cache;
    }

    GetStateFromStore(): void {
        const state = getPublishableItemStatus(this.id);
        if (state !== null) {
            this.status.cacheStatus = "ready";
            // this.data = manifest;
        } else {
            this.status.cacheStatus = "prepared";
        }
    }

    /** Get the data from the store and use it to fill the `data` member */
    abstract GetDataFromStore(): void;

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

    /** Cleans the supplied request object and uses it to set this item's #requestObject and #requestObjectCleaned values */
    private CleanRequestObject(srcReq: Request): void {
        if (!srcReq.headers.has("authorization")) {
            this.#requestObjectCleaned = false;
            this.#requestObjectClean = false;
            this.#requestObject = srcReq;
        }

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
        }

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        await this.cache.put(this.#requestObject!, this.updatedResp);
        this.#requestObjectClean = true;

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
        if (isInitialised) {
            this.status.cacheStatus = "ready";
        } else {
            this.status.cacheStatus = "loading";
        }
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

    /** Tells Appelflap to publish this item's cache
     * @returns
     * - resolve(true) on success,
     * - resolve(false) if isPublishable is false or appelflap connect wasn't provided,
     * - reject(false) on error
     */
    async publish(appelflapConnect: AppelflapConnect): Promise<boolean> {
        if (!this.isPublishable || !appelflapConnect) {
            return Promise.resolve(false);
        }

        const cachePublish = new CachePublish(appelflapConnect);

        const cacheToPublish = {
            webOrigin: btoa(self.origin),
            cacheName: btoa(this.cacheKey),
            version: this.version,
        };
        try {
            await cachePublish.publish(cacheToPublish);
            return await Promise.resolve(true);
        } catch (error) {
            return await Promise.reject(false);
        }
    }
}
