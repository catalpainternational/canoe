/* eslint-disable @typescript-eslint/no-unused-vars */
import { TAssetEntry, TPageData } from "ts/Types/ManifestTypes";
import { TAssetStatus } from "ts/Types/CanoeEnums";
import { JPEG_RENDITION, WEBP_BROWSERS, WEBP_RENDITION } from "ts/Constants";
import { getBrowser } from "ts/PlatformDetection";

// See ts/Typings for the type definitions for these imports
import { getAuthenticationToken } from "js/AuthenticationUtilities";
import { BACKEND_BASE_URL } from "js/urls";
import { MissingImageError } from "js/Errors";

export class Asset implements TAssetEntry {
    #cache!: Cache;
    #blob?: Blob;
    data!: TAssetEntry;
    #status!: TAssetStatus;
    /** The original request object that works as the key into the cache */
    #requestObject?: Request;
    /** Indicates whether the above requestObject had to have the authorizarion header stripped */
    #requestObjectCleaned = false;

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    constructor(opts?: any) {
        this.#status = "unset";
        if (!this.data) {
            this.data = Asset.emptyItem;
            this.#status = "empty";
        }
        if (typeof opts === "undefined") {
            return;
        }
        if (typeof opts === "string") {
            this.data.api_url = opts;
            this.#status = "prepped:type";
        } else if (opts as TPageData) {
            this.clone(opts);
            this.#status = "prepped:manifest";
        }
    }

    get type(): string {
        return this.data?.type || "";
    }

    get renditions(): Record<string, string> {
        return this.data?.renditions || {};
    }

    get platformSpecificRendition(): string {
        return getBrowser().name === "Safari" ? JPEG_RENDITION : WEBP_RENDITION;
    }

    /** The url of the rendition that is most relevant to this platform */
    get rendition(): string {
        const renditionType = this.platformSpecificRendition;
        const rendition = this.renditions[renditionType];

        if (!rendition) {
            const error = `${renditionType} image doesn't exist.
            Renditions: ${JSON.stringify(this.renditions)}`;
            throw new MissingImageError(error);
        }

        return rendition;
    }

    /** Alias for rendition, always prefixed with a '/' */
    get api_url(): string {
        let rend = this.rendition || "";
        if (rend && !rend.startsWith("/")) {
            rend = `/${rend}`;
        }
        return rend;
    }

    get fullUrl(): string {
        return `${BACKEND_BASE_URL}/media${this.api_url}`;
    }

    /** This will do a basic integrity check.
     */
    get isValid(): boolean {
        // Is the asset's status acceptable
        if (
            [
                "unset",
                "empty",
                "prepped:no cache",
                "prepped:no type",
                "prepped:no fetch",
            ].includes(this.#status)
        ) {
            return false;
        }

        return true;
    }

    get isAvailableOffline(): boolean {
        if (!this.isValid) {
            return false;
        }

        // Is the page's status acceptable
        if (!this.#status.startsWith("ready")) {
            return false;
        }

        return true;
    }

    /** Always returns false, an Asset is not publishable on its own */
    get isPublishable(): boolean {
        return false;
    }

    get status(): string {
        return this.#status;
    }

    static get emptyItem(): TAssetEntry {
        return {
            type: "",
            renditions: {},
            isValid: false,
            isAvailableOffline: false,
            isPublishable: false,
        };
    }

    clone(data: TAssetEntry): void {
        this.data = JSON.parse(JSON.stringify(data));
    }

    private CleanRequest(srcReq: Request): Request {
        if (!srcReq.headers.has("authorization")) {
            this.#requestObjectCleaned = false;
            return srcReq;
        }

        const headers = new Headers();
        for (const key of srcReq.headers.keys()) {
            if (key !== "authorization") {
                headers.append(key, srcReq.headers.get(key) || "");
            }
        }

        this.#requestObjectCleaned = true;
        return new Request(srcReq.url, {
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

    private get contentType(): string {
        let contentType = "application/json";
        if (this.type === "image") {
            contentType =
                getBrowser().name in WEBP_BROWSERS
                    ? "image/webp"
                    : "image/jpeg";
        }

        return contentType;
    }

    /** Build a request object we can use to fetch this item */
    private BuildRequestObject(): Request {
        return new Request(this.fullUrl, {
            cache: "no-cache",
            headers: {
                "Content-Type": this.contentType,
                Authorization: `JWT ${getAuthenticationToken()}`,
            },
            method: "GET",
        } as RequestInit);
    }

    /** Get the Request Object from the currently cached item */
    private async GetRequestObject(): Promise<Request | undefined> {
        if (this.#requestObject && this.#requestObject.url === this.fullUrl) {
            this.#requestObject = this.CleanRequest(this.#requestObject);
            return this.#requestObject;
        }

        const requests = await this.#cache.keys(this.fullUrl, {
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
            requests.slice(1).forEach((request) => {
                // this.#cache.delete(key);
            });
        }

        this.#requestObject = this.CleanRequest(requests[0]);
        return this.#requestObject;
    }

    private async initialiseFromResponse(resp: Response): Promise<boolean> {
        this.#blob = await resp.blob();

        return !!this.#blob;
    }

    private async accessCache(): Promise<boolean> {
        this.#cache = await caches.open(this.api_url);

        return !!this.#cache;
    }

    private async getFromCache(
        request: Request
    ): Promise<Response | undefined> {
        const response = await this.#cache.match(request);

        return response;
    }

    async initialiseFromCache(): Promise<boolean> {
        const cacheSet = await this.accessCache();
        if (!this.api_url) {
            this.#status = "prepped:no url";
            return false;
        }

        const reqObj = await this.GetRequestObject();
        if (!reqObj) {
            this.#status = "prepped:no cache";
            return false;
        }

        this.#status = "loading:cache";
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const response = await this.getFromCache(reqObj!);

        if (!response) {
            this.#status = "prepped:no cache";
            return false;
        }

        const isInitialised = await this.initialiseFromResponse(response);
        if (isInitialised) {
            this.#status = "ready:cache";
        } else {
            this.#status = "loading:no cache";
        }
        return isInitialised;
    }

    private async updateCache(): Promise<boolean> {
        if (!(await this.accessCache())) {
            this.#status = "prepped:no url";
            return false;
        }

        let reqObj = await this.GetRequestObject();
        if (!reqObj) {
            this.#status = "prepped:no cache";
            reqObj = this.BuildRequestObject();
            this.#requestObject = this.CleanRequest(reqObj);
        }

        this.#status = "loading:cache";
        // Create the new response to go into the cache
        const updatedResp = new Response(this.#blob);

        if (this.#requestObjectCleaned) {
            // Delete the existing cache entry first to ensure that the auth key gets 'lost'
            const deleted = await this.#cache.delete(reqObj);
        }

        // cache.put returns a Promise<void>, which means you can't really await it
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        await this.#cache.put(this.#requestObject!, updatedResp);

        return true;
    }

    async initialiseByRequest(): Promise<boolean> {
        this.#status = "loading:fetch";

        const reqObj = new Request(this.fullUrl, {
            mode: "cors",
            cache: "no-cache",
            headers: {
                "Content-Type": this.contentType,
                Authorization: `JWT ${getAuthenticationToken()}`,
            },
            method: "GET",
        } as RequestInit);
        this.#requestObject = this.CleanRequest(reqObj);

        // Fetch the page from the network
        const resp = await fetch(reqObj);

        if (!resp.ok) {
            this.#status = "prepped:no fetch";
            return false;
        }

        const isInitialised = await this.initialiseFromResponse(resp);
        if (isInitialised) {
            this.#status = "ready:fetch";
        }

        return isInitialised;
    }
}
