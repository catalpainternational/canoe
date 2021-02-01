/* eslint-disable @typescript-eslint/no-unused-vars */
import {
    TAssetEntry,
    TAssetEntryData,
    TPage,
    TPageData,
    TWagtailPage,
    TWagtailPageData,
} from "ts/Types/ManifestTypes";
import { PAGES_CACHE_NAME } from "ts/Constants";
import { TPageStatus } from "ts/Types/CanoeEnums";

// See ts/Typings for the type definitions for these imports
import { getAuthenticationToken } from "js/AuthenticationUtilities";
import { BACKEND_BASE_URL } from "js/urls";
import { Asset } from "./Asset";

export class Page implements TWagtailPage {
    #cache!: Cache;
    data!: TWagtailPageData;
    #status!: TPageStatus;
    /** The original request object that works as the key into the cache */
    #requestObject?: Request;

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    constructor(opts?: any) {
        this.#status = "unset";
        if (!this.data) {
            this.data = Page.emptyItem;
            this.#status = "empty";
        }
        if (typeof opts === "undefined") {
            return;
        }
        if (typeof opts === "string") {
            this.data.api_url = opts;
            this.#status = "prepped:url";
        } else if (opts as TPageData) {
            this.clone(opts);
            this.#status = "prepped:manifest";
        }
    }

    get loc_hash(): string {
        return this.data?.loc_hash || "";
    }

    get storage_container(): string {
        return this.data?.storage_container || "";
    }

    get version(): number {
        return this.data?.version || 0;
    }

    get api_url(): string {
        return this.data?.api_url || "";
    }

    get assets(): Array<TAssetEntry> {
        return this.data?.assets || [];
    }

    get language(): string {
        return this.data?.language || "";
    }

    get children(): Array<number> {
        return this.data?.children || [];
    }

    get depth(): number {
        return this.data?.depth || 0;
    }

    get type(): string {
        return this.data?.type || "";
    }

    get title(): string {
        return this.data?.title || "";
    }

    /** From old wagtail page definition */
    get meta(): Record<string, any> | undefined {
        return this.data?.meta;
    }

    get pageId(): string {
        if (this.data.id) {
            return this.data.id.toString();
        }

        const url = this.api_url.split("/").filter((token) => token);
        return url.length ? url[url.length - 1] : "";
    }

    get fullUrl(): string {
        return `${BACKEND_BASE_URL}${this.api_url}`;
    }

    /** This will do a basic integrity check.
     * version is not 0, api_url has a value, etc.
     */
    get isValid(): boolean {
        if (this.version === 0 || !this.api_url) {
            return false;
        }

        // Has the wagtail version of this page been loaded
        if (
            !this.meta ||
            !this.data.data ||
            !this.data.id ||
            !this.data.title
        ) {
            return false;
        }

        // Is the page's status acceptable
        if (
            [
                "unset",
                "empty",
                "prepped:no cache",
                "prepped:no url",
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

        if (this.assets.length > 0) {
            return this.assets.every(
                (asset) =>
                    this.assetInitialised(asset) &&
                    (asset as Asset).isAvailableOffline
            );
        }

        return true;
    }

    get isPublishable(): boolean {
        if (!this.isValid) {
            return false;
        }

        // Is the page's status acceptable
        if (!this.#status.startsWith("ready")) {
            return false;
        }

        if (this.assets.length > 0) {
            return this.assets.every(
                (asset) =>
                    this.assetInitialised(asset) &&
                    (asset as Asset).status.startsWith("ready")
            );
        }

        return true;
    }

    get status(): string {
        return this.#status;
    }

    static get emptyItem(): TWagtailPage {
        return {
            loc_hash: "",
            storage_container: "",
            version: 0,
            api_url: "",
            assets: [],
            language: "",
            children: [],
            depth: 0,
            type: "",
            title: "",
            isValid: false,
            isAvailableOffline: false,
            isPublishable: false,
        };
    }

    private clone(data: TPage): void {
        this.data = JSON.parse(JSON.stringify(data));
    }

    private async GetRequestObject(): Promise<Request | undefined> {
        if (this.#requestObject) {
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

        this.#requestObject = requests[0];
        if (requests.length > 1) {
            // We should really clean the cache in this case
            // But we still don't know how to do that properly
            requests.slice(1).forEach((request) => {
                // this.#cache.delete(key);
            });
        }

        return this.#requestObject;
    }

    private async initialiseFromResponse(resp: Response): Promise<boolean> {
        const pageData = await resp.json();
        // Merge the existing page definition into this structure
        if (pageData?.api_url) {
            // New format
            const dataKeys = Object.keys(this.data);
            const respKeys = Object.keys(pageData);
            dataKeys.forEach((dataKey) => {
                if (!respKeys.includes(dataKey)) {
                    return;
                }
                const dataIsArray = Array.isArray(this.data[dataKey]);
                const respIsArray = Array.isArray(pageData[dataKey]);
                if (dataIsArray) {
                    if (!respIsArray || pageData[dataKey].length === 0) {
                        // Don't bother copying empty arrays
                        // this protects the existing array coming from manifest
                        // when the cached version is not quite right
                        return;
                    }
                    // We can add more smarts here to ensure that details from the manifest
                    // are better persisted
                }
                if (typeof this.data[dataKey] === "object" || dataIsArray) {
                    this.data[dataKey] = JSON.parse(
                        JSON.stringify(pageData[dataKey])
                    );
                } else {
                    this.data[dataKey] = pageData[dataKey];
                }
            });
            respKeys.forEach((respKey) => {
                if (dataKeys.includes(respKey)) {
                    return;
                }
                const respIsArray = Array.isArray(pageData[respKey]);
                if (typeof pageData[respKey] === "object" || respIsArray) {
                    this.data[respKey] = JSON.parse(
                        JSON.stringify(pageData[respKey])
                    );
                } else {
                    this.data[respKey] = pageData[respKey];
                }
            });
        } else {
            // Merge old and new
            this.data = { ...this.data, ...pageData };
        }
        return !!(await this.getAssets());
    }

    private async accessCache(): Promise<boolean> {
        this.#cache = await caches.open(PAGES_CACHE_NAME);

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

        const reqObj = await this.GetRequestObject();
        if (!reqObj) {
            this.#status = "prepped:no cache";
            return false;
        }

        this.#status = "loading:cache";
        // Create the new response to go into the cache
        const updatedResp = new Response(JSON.stringify(this.data));

        // cache.put returns a Promise<void>, which means you can't really await it
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        await this.#cache.put(reqObj!, updatedResp);

        return true;
    }

    async initialiseByRequest(): Promise<boolean> {
        this.#status = "loading:fetch";

        // If we need to use cache.add instead of fetch
        // then we have to start with building a full Request
        // to get the RequestInfo object
        // const request = new Request(this.fullUrl, {
        //     cache: "no-cache",
        //     method: "GET",
        //     headers: {
        //         "Content-Type": "application/json",
        //         Authorization: `JWT ${getAuthenticationToken()}`,
        //     },
        // });

        // Fetch the page from the network
        const resp = await fetch(this.fullUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `JWT ${getAuthenticationToken()}`,
            },
        });

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

    private assetInitialised(asset: TAssetEntry): boolean {
        return asset.isValid || false;
    }

    async getAsset(asset: TAssetEntryData): Promise<TAssetEntry> {
        const pageAsset = new Asset(asset);
        if (pageAsset.isAvailableOffline) {
            // The asset was embedded
            return pageAsset;
        }
        // Asset not embedded - needs retrieval
        const assetFilled = await pageAsset.initialiseByRequest();
        if (assetFilled) {
            return pageAsset;
        }

        return Promise.reject(false);
    }

    async getAssets(): Promise<Array<TAssetEntry>> {
        if (this.assets.length === 0) {
            return this.assets;
        }

        const assets: Array<any> = [];
        this.assets.forEach(async (asset) => {
            try {
                asset = await this.getAsset(asset);
            } catch {
                // Could not fill the asset
            }
            assets.push(asset);
        });
        this.data.assets = assets;

        const cacheUpdated = await this.updateCache();

        return this.assets;
    }
}
