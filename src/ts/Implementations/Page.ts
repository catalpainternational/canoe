/* eslint-disable @typescript-eslint/no-unused-vars */
import {
    TAssetEntry,
    TAssetEntryData,
    TPage,
    TPageData,
    TWagtailPage,
    TWagtailPageData,
} from "ts/Types/ManifestTypes";
import { CacheHandler } from "ts/CacheHandler";
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
        this.initialiseFromCache();
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
            return this.assets.every((asset) =>
                asset.status.startsWith("ready")
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

    clone(data: TPage): void {
        this.data = JSON.parse(JSON.stringify(data));
    }

    async initialiseFromResponse(resp: Response): Promise<void> {
        const pageData = await resp.json();
        // Merge the existing page definition into this structure
        if (pageData?.api_url) {
            // New format
            this.data = pageData;
        } else {
            // Merge old and new
            this.data = { ...this.data, ...pageData };
        }
    }

    async initialiseFromCache(): Promise<void> {
        this.#cache = await caches.open(PAGES_CACHE_NAME);

        if (!this.api_url) {
            this.#status = "prepped:no url";
            return;
        }

        this.#status = "loading:cache";
        const resp = await this.#cache.match(this.fullUrl, {
            ignoreSearch: true,
            ignoreMethod: true,
            ignoreVary: true,
        });

        if (!resp) {
            this.#status = "prepped:no cache";
            return;
        }

        await this.initialiseFromResponse(resp);
        this.#status = "ready:cache";
    }

    async initialiseByRequest(): Promise<boolean> {
        this.#status = "loading:fetch";
        const resp = await fetch(this.fullUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `JWT ${getAuthenticationToken()}`,
            },
        });

        if (!resp.ok) {
            this.#status = "prepped:no fetch";
            return true;
        }

        await this.initialiseFromResponse(resp);
        this.#status = "ready:fetch";

        return true;
    }

    async getAsset(data: TAssetEntryData): Promise<TAssetEntry> {
        const pageAsset = new Asset(data);
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

        this.assets.forEach(async (asset) => {
            try {
                asset = await this.getAsset(asset);
            } catch {
                // Could not fill the asset
            }
        });

        return this.assets;
    }

    async getImages(): Promise<any[]> {
        const images = new Set(
            this.assets.map((asset: TAssetEntry) => asset.renditions)
        );

        return [...images];
    }
}
