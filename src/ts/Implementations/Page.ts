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
import {
    getManifestFromStore,
    getPageData as getPageDataFromStore,
    storePageData,
} from "ReduxImpl/Interface";
import { Manifest } from "./Manifest";
import { TManifestData } from "../Types/ManifestTypes";

export class Page implements TWagtailPage {
    #cache!: Cache;
    #manifest: Manifest;
    #id: number;
    pageData!: TWagtailPageData;
    #status!: string;
    #childPages: Page[] | undefined;

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    constructor(manifest: Manifest, id: number) {
        this.#manifest = manifest;
        this.#id = id;

        const pageData = getPageDataFromStore(this.id);
        if (pageData) {
            this.pageData = pageData;
        }
        this.#childPages = this.children.map(
            this.#manifest.getSpecificPage,
            this.#manifest
        );
    }

    get childPages(): Page[] | undefined {
        if (this.#childPages === undefined) {
            this.#childPages = this.children.map((childId: number) => {
                return this.#manifest.getSpecificPage(childId);
            });
        }
        return this.#childPages;
    }

    get ready(): boolean {
        return !!this.#status && this.#status.startsWith("ready");
    }
    get manifestData(): any {
        return this.#manifest.pages[this.id];
    }

    get title(): string {
        return this.manifestData?.title || "";
    }

    get loc_hash(): string {
        return this.manifestData?.loc_hash || "";
    }

    get id(): number {
        return this.#id;
    }

    get storage_container(): string {
        return this.manifestData?.storage_container || "";
    }

    get version(): number {
        return this.manifestData?.version || 0;
    }

    get api_url(): string {
        return this.manifestData?.api_url || "";
    }

    get type(): string {
        return this.manifestData?.type || "";
    }

    get assets(): Array<TAssetEntry> {
        return this.manifestData?.assets || [];
    }

    get language(): string {
        return this.manifestData?.language || "";
    }

    get children(): Array<number> {
        return this.manifestData?.children || [];
    }

    get depth(): number {
        return this.manifestData?.depth || 0;
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

    async initialiseFromResponse(resp: Response): Promise<void> {
        const pageData = await resp.json();
        this.pageData = pageData;
        this.#status = "ready";
        storePageData(pageData.id, pageData);
    }

    async initialiseFromCache(): Promise<void> {
        this.#cache = await caches.open(PAGES_CACHE_NAME);

        if (this.api_url) {
            this.#status = "loading:cache";
            const resp = await this.#cache.match(this.fullUrl, {
                ignoreSearch: true,
                ignoreMethod: true,
                ignoreVary: true,
            });
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
        const token: string = getAuthenticationToken();
        const resp = await fetch(this.fullUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: token ? "JWT " + token : "",
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
