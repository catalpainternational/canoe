/* eslint-disable @typescript-eslint/no-unused-vars */
import {
    TAssetEntry,
    TPage,
    TWagtailPage,
    TWagtailPageData,
} from "ts/Types/ManifestTypes";

// See ts/Typings for the type definitions for these imports
import { storeWagtailPage, getWagtailPageFromStore } from "ReduxImpl/Interface";
import { getAuthenticationToken } from "js/AuthenticationUtilities";
import { BACKEND_BASE_URL } from "js/urls";

export class Page implements TWagtailPage {
    data!: TWagtailPageData;

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    constructor(opts?: any) {
        if (!this.data) {
            this.data = Page.emptyItem;
        }
        if (typeof opts === "undefined") {
            return;
        }
        if (typeof opts === "string") {
            this.data.api_url = opts;
        } else if (opts instanceof Page) {
            this.clone(opts);
        }
        this.initialiseFromStore();
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

    initialiseFromStore(): void {
        if (this.pageId) {
            const pageData = getWagtailPageFromStore(this.pageId);
            if (pageData?.api_url) {
                // New format
                this.data = pageData;
            } else {
                // Merge old and new
                this.data = { ...this.data, ...pageData };
            }
        }
    }

    async initialiseByRequest(): Promise<boolean> {
        const resp = await fetch(`${BACKEND_BASE_URL}${this.api_url}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `JWT ${getAuthenticationToken()}`,
            },
        });
        // Merge the existing page definition into this structure
        const wagtailPage = await resp.json();
        this.data = { ...this.data, ...wagtailPage };
        storeWagtailPage(this.data);

        return true;
    }

    async getImages(): Promise<any[]> {
        const images = new Set(
            this.assets.map((asset: TAssetEntry) => asset.renditions)
        );

        return [...images];
    }
}
