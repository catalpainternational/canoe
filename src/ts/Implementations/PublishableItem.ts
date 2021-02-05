import { BACKEND_BASE_URL } from "js/urls";

import { IManifestItemState } from "ts/Interfaces/ManifestInterfaces";
import { TManifestItemSource, TManifestItemStatus } from "ts/Types/CanoeEnums";
import { TManifestItem } from "ts/Types/ManifestTypes";

// See ts/Typings for the type definitions for these imports
import { getAuthenticationToken } from "js/AuthenticationUtilities";

export abstract class PublishableItem<
    T extends IManifestItemState,
    D extends TManifestItem
> implements IManifestItemState {
    data!: D;
    cache!: Cache;

    status!: TManifestItemStatus;
    source: TManifestItemSource;

    /** The original request object (stripped of any authentication values) that works as the key into the cache */
    #requestObject: Request;
    /** Indicates whether the above #requestObject had to have the authorization header stripped */
    #requestObjectCleaned = false;

    constructor(opts?: undefined | string | T) {
        this.status = "unset";
        this.source = "unset";
        this.#requestObject = new Request("");

        if (!this.data) {
            this.data = this.emptyItem;
            this.status = "empty";
        }

        if (typeof opts === "undefined") {
            return;
        }

        if (typeof opts === "string") {
            this.data.api_url = opts;
            this.status = "prepped";
        } else if (opts as T | D) {
            this.clone(opts);
            this.status = "prepped";
        }
    }

    get api_url(): string {
        return this.data?.api_url || "";
    }

    abstract get fullUrl(): string;

    get emptyItem(): D {
        return ({
            source: "unset",
            status: "unset",
            api_url: "",
            fullUrl: "",
            isValid: false,
            isAvailableOffline: false,
            isPublishable: false,
            contentType: "",
            cache: new Cache(),
        } as unknown) as D;
    }

    abstract get contentType(): string;

    /** This will do a basic integrity check. */
    get isValid(): boolean {
        if (!this.api_url) {
            return false;
        }

        // Is the item's status acceptable
        if (
            this.source === "unset" ||
            ["unset", "empty", "prepped"].includes(this.status)
        ) {
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

        // Is the item's status acceptable
        if (this.status !== "ready") {
            return false;
        }

        return true;
    }

    /** This is only a very basic check.
     * Implementing classes must call this via super, and extend to meet their requirements. */
    get isPublishable(): boolean {
        if (!this.isValid) {
            return false;
        }

        // Is the items's status acceptable
        if (this.status === "ready") {
            return false;
        }

        return true;
    }

    /** Build a request object we can use to fetch this item */
    private get NewRequestObject(): Request {
        const headers: any = {
            "Content-Type": this.contentType,
            Authorization: `JWT ${getAuthenticationToken()}`,
        };

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

    abstract accessCache(): Promise<boolean>;

    private clone(data: T): void {
        this.data = JSON.parse(JSON.stringify(data));
    }

    /** Cleans the supplied request object and uses it to set this item's #requestObject and #requestObjectCleaned values */
    private CleanRequestObject(srcReq: Request): void {
        if (!srcReq.headers.has("authorization")) {
            this.#requestObjectCleaned = false;
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
        if (this.#requestObject && this.#requestObject.url === this.fullUrl) {
            this.CleanRequestObject(this.#requestObject);
            return this.#requestObject;
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
        return this.#requestObject
            ? await this.cache.match(this.#requestObject)
            : undefined;
    }

    async updateCache(): Promise<boolean> {
        if (!(await this.accessCache())) {
            this.source = "unset";
            this.status = "prepped";
            return false;
        }

        let reqObj = await this.GetRequestObject();
        if (!reqObj) {
            this.source = "unset";
            this.status = "prepped";
            reqObj = this.NewRequestObject;
            this.CleanRequestObject(reqObj);
        }

        this.source = "cache";
        this.status = "loading";

        if (this.#requestObjectCleaned) {
            // Delete the existing cache entry first to ensure that the auth key gets 'lost'
            await this.cache.delete(reqObj);
        }

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        await this.cache.put(this.#requestObject!, this.updatedResp);

        return true;
    }

    /** Initialise this item from a response, either cached or from the network */
    abstract initialiseFromResponse(resp: Response): Promise<boolean>;

    /** Initialise this item from the cache */
    async initialiseFromCache(): Promise<boolean> {
        const cacheSet = await this.accessCache();
        if (!cacheSet || !this.api_url) {
            this.source = "unset";
            this.status = "prepped";
            return false;
        }

        const reqObj = await this.GetRequestObject();
        if (!reqObj) {
            this.source = "unset";
            this.status = "prepped";
            return false;
        }

        this.source = "cache";
        this.status = "loading";
        const response = await this.getFromCache();

        if (!response) {
            this.source = "unset";
            this.status = "prepped";
            return false;
        }

        const isInitialised = await this.initialiseFromResponse(response);
        if (isInitialised) {
            this.status = "ready";
        } else {
            this.source = "unset";
            this.status = "loading";
        }
        return isInitialised;
    }

    /** Initialise this item from a network request */
    async initialiseByRequest(): Promise<boolean> {
        this.source = "network";
        this.status = "loading";

        const reqObj = this.NewRequestObject;
        this.CleanRequestObject(reqObj);

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

            this.source = "unset";
            this.status = "prepped";
            return false;
        }

        const isInitialised = await this.initialiseFromCache();
        if (isInitialised) {
            this.status = "ready";
        }

        return isInitialised;
    }
}
