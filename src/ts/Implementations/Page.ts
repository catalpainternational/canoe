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

export class Page implements TWagtailPage {
    data!: TWagtailPageData;

    constructor() {
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
    get meta(): string {
        return this.data?.language || "";
    }

    get pageId(): string {
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
            meta: "",
            isValid: false,
            isAvailableOffline: false,
            isPublishable: false,
        };
    }

    initialiseFromStore(): void {
        if (this.pageId) {
            this.data = getWagtailPageFromStore(this.pageId);
        }
    }

    async initialiseByRequest(): Promise<void> {
        const resp = await fetch(this.api_url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `JWT ${getAuthenticationToken()}`,
            },
        });
        this.data = await resp.json();
        storeWagtailPage(this.data);
    }

    async getImages(): Promise<any[]> {
        const images = new Set(
            this.assets.map((asset: TAssetEntry) => asset.renditions)
        );

        return [...images];
    }

    getPageData(
        locationHash: string,
        languageCode: string
    ): Record<string, unknown> {
        throw new Error("Method not implemented.");
    }

    getPageDetail(locationHash: string, languageCode: string): TPage {
        throw new Error("Method not implemented.");
    }
}
