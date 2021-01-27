/* eslint-disable @typescript-eslint/no-unused-vars */
import {
    TAssetEntry,
    TPage,
    TPageData,
    TWagtailPage,
    TWagtailPageData,
} from "ts/Types/ManifestTypes";
import { CacheHandler } from "ts/CacheHandler";
import { PAGES_CACHE_NAME } from "ts/Constants";

// See ts/Typings for the type definitions for these imports
import { getAuthenticationToken } from "js/AuthenticationUtilities";
import { BACKEND_BASE_URL } from "js/urls";

export class Page implements TWagtailPage {
    data!: TWagtailPageData;
    #status!: string;

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
     * But for now it just checks that page details have actually been loaded, same as isPublishable
     */
    get isValid(): boolean {
        if (this.version === 0) {
            return false;
        }

        return true;
    }

    get isAvailableOffline(): boolean {
        if (this.version === 0) {
            return false;
        }

        return this.isValid;
    }

    get isPublishable(): boolean {
        if (this.version === 0) {
            return false;
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
        if (this.api_url) {
            this.#status = "loading:cache";
            const cacheHandler = new CacheHandler();
            const resp = await cacheHandler.match(
                PAGES_CACHE_NAME,
                this.fullUrl
            );
            if (resp) {
                await this.initialiseFromResponse(resp);
                this.#status = "ready:cache";
            } else {
                this.#status = "prepped:no cache";
            }
        } else {
            this.#status = "prepped:no url";
        }
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

        if (resp.ok) {
            await this.initialiseFromResponse(resp);
            this.#status = "ready:fetch";
        } else {
            this.#status = "prepped:no fetch";
        }

        return true;
    }

    async getImages(): Promise<any[]> {
        const images = new Set(
            this.assets.map((asset: TAssetEntry) => asset.renditions)
        );

        return [...images];
    }
}
