/* eslint-disable @typescript-eslint/no-unused-vars */
import { TManifest } from "../Types/ManifestTypes";
import { TWagtailPageData } from "../Types/PageTypes";
import { TAssetEntry, TAssetEntryData } from "../Types/AssetTypes";

import { PublishableItem } from "../Implementations/PublishableItem";
import { Asset } from "../Implementations/Asset";
import {
    InitialiseByRequest,
    InitialiseFromCache,
    UpdateCachedItem,
} from "../Implementations/CacheItem";

// See ts/Typings for the type definitions for these imports
import { BACKEND_BASE_URL } from "js/urls";
import {
    getPageData as getPageDataFromStore,
    storePageData,
} from "ReduxImpl/Interface";

export class Page extends PublishableItem<TWagtailPageData> {
    #parent: Page | undefined;
    #childPages: Page[];
    /** The actual assets referenced by this page */
    #assets: Asset[];

    constructor(
        manifest: TManifest,
        id: string,
        statusId: string,
        parent?: Page
    ) {
        super(manifest, id, statusId);

        // Populate the parent and childPages members
        this.#parent = parent || this.parent;
        this.#childPages = this.childPages;
        this.#assets = [];
    }

    get childPages(): Page[] {
        if (this.#childPages) {
            return this.#childPages;
        }

        this.#childPages = this.children.map(
            (pageId) => this.manifest.getSpecificPage(pageId, this),
            this.manifest
        );
        return this.#childPages;
    }

    get title(): string {
        return this.manifestData?.title || "";
    }

    get loc_hash(): string {
        return this.manifestData?.loc_hash || "";
    }

    get slug(): string {
        return this.manifestData.slug;
    }

    /** The data for this page as defined in the manifest */
    get manifestData(): TWagtailPageData {
        return this.manifest.pages[this.id] || {};
    }

    get parent(): Page | undefined {
        if (this.#parent) {
            return this.#parent;
        }

        const parentId: string | undefined = Object.keys(
            this.manifest.pages
        ).find((id: string) => {
            const page = this.manifest.pages[id];
            return page.children.indexOf(this.id) !== -1;
        });

        this.#parent = parentId
            ? this.manifest.getSpecificPage(parentId)
            : undefined;
        return this.#parent;
    }

    get storage_container(): string {
        return this.manifestData?.storage_container || "";
    }

    get version(): number {
        return this.manifestData?.version || -1;
    }

    set version(value: number) {
        if (this.manifestData) {
            this.manifestData.version = value;
        }

        super.version = value;
    }

    get api_url(): string {
        return this.manifestData?.api_url || "";
    }

    get fullUrl(): string {
        return `${BACKEND_BASE_URL}${this.api_url}`;
    }

    get type(): string {
        return this.manifestData?.type || "";
    }

    /** The asset data as defined in the manifest for this page */
    get manifestAssets(): Array<TAssetEntry> {
        return this.manifestData?.assets || [];
    }

    /** The assets associated with this page */
    get assets(): Array<Asset> {
        return this.#assets || [];
    }

    get language(): string {
        return this.manifestData?.language || "";
    }

    get children(): Array<string> {
        return this.manifestData?.children || [];
    }

    get depth(): number {
        return this.manifestData?.depth || 0;
    }

    get cardImage(): string {
        return this.manifestData?.card_image || "";
    }

    get tags(): string[] {
        return this.manifestData?.tags || [];
    }

    get contentType(): string {
        return "application/json";
    }

    /** This will do a basic integrity check.
     * version is not < 0, wagtail data loaded
     */
    get isValid(): boolean {
        if (!super.isValid) {
            return false;
        }

        if (this.version < 0) {
            return false;
        }

        // Has the wagtail version of this page been loaded
        return !!this.data.data && !!this.data.id && !!this.data.title;
    }

    /** A page isAvailableOffline if it, and all of its assets and child pages, are available offline. */
    get isAvailableOffline(): boolean {
        if (!super.isAvailableOffline) {
            return false;
        }

        // Compare the number of assets defined in the manifest for this page
        // With the number of actual page objects
        if (this.manifestAssets.length !== this.#assets.length) {
            return false;
        }

        if (this.manifestAssets.length === 0 && this.#childPages.length === 0) {
            return true;
        }

        const allAssetsAvailableOffline = this.#assets.every(
            (asset) => this.assetInitialised(asset) && asset.isAvailableOffline
        );
        if (!allAssetsAvailableOffline) {
            return false;
        }

        return this.#childPages.every(
            (childPage) => childPage.isAvailableOffline
        );
    }

    /** A page isPublishable if it, and all of its assets, are publishable.
     * That is, are they all present in this page's cache. */
    get isPublishable(): boolean {
        if (!super.isPublishable) {
            return false;
        }

        // Compare the number of assets defined in the manifest for this page
        // With the number of actual page objects
        if (this.manifestAssets.length !== this.#assets.length) {
            return false;
        }

        if (this.manifestAssets.length === 0 && this.#childPages.length === 0) {
            return true;
        }

        // Assets are not publishable on their own,
        // Their isPublishable status is only relevant here
        return this.#assets.every((asset) => asset.isPublishable);
    }

    get emptyItem(): TWagtailPageData {
        const empty = super.emptyItem;

        empty.loc_hash = "";
        empty.storage_container = "";
        empty.version = 0;
        empty.assets = [];
        empty.language = "";
        empty.children = [];
        empty.depth = 0;
        empty.type = "";
        empty.title = "";

        return empty;
    }

    GetDataFromStore(): void {
        const pageData = getPageDataFromStore(this.id);
        if (pageData) {
            this.data = pageData;
            this.status.storeStatus = "ready";
        } else {
            this.status.storeStatus = "unset";
        }
    }

    StoreDataToStore(): void {
        // And store the page data in Redux
        this.status.storeStatus = "unset";
        storePageData(this.id, this.data);
        this.status.storeStatus = "ready";
    }

    get updatedResp(): Response {
        return new Response(JSON.stringify(this.data), { headers: this.respHeaders });
    }

    get cacheKey(): string {
        return this.storage_container;
    }

    async initialiseFromResponse(resp: Response): Promise<boolean> {
        this.status.cacheStatus = "loading";
        try {
            this.respHeaders = resp.headers;
            this.data = await resp.json();
        } catch {
            // We assume a bad cached entry, i.e. bad json
            return false;
        }

        // And store the page data in Redux
        this.StoreDataToStore();

        // Update the cached paged data
        const cacheUpdated = await UpdateCachedItem(this);

        await this.loadAssets();

        return cacheUpdated;
    }

    private assetInitialised = (asset: TAssetEntry): boolean =>
        asset.isValid || false;

    async loadAsset(asset: TAssetEntryData): Promise<Asset> {
        // The asset's cache name is the same as the Page's cache name
        // However its statusId points to its api_url
        const pageAsset = new Asset(
            this.manifest,
            this.id,
            asset.id.toString(),
            asset.api_url,
            this.cacheKey
        );
        const assetFilled = await InitialiseFromCache(pageAsset);

        if (assetFilled) {
            return pageAsset;
        }
        const notInCache = ["prepared", "loading"].includes(
            pageAsset.status.cacheStatus
        );
        if (notInCache) {
            if (await InitialiseByRequest(pageAsset)) {
                return pageAsset;
            }
        }

        return Promise.reject(false);
    }

    /** Load up the assets referenced by this Page */
    async loadAssets(): Promise<void> {
        if (this.manifestAssets.length === 0) {
            return;
        }

        this.#assets = [];
        for (let ix = 0; ix < this.manifestAssets.length; ix++) {
            try {
                const asset = await this.loadAsset(this.manifestAssets[ix]);
                this.#assets.push(asset);
            } catch {
                // Could not fill the asset
            }
        }
    }

    getAssetsByIdAndType(
        id: number | string,
        assetType: string
    ): TAssetEntry | undefined {
        const assets = this.manifestData.assets;
        return assets.find((a: TAssetEntry) => {
            return a.id === id.toString() && a.type === assetType;
        });
    }

    PETEgetImageRenditions = (id: number | string): TAssetEntry | undefined =>
        this.getAssetsByIdAndType(id, "image");

    PETEgetMediaRenditions = (id: number | string): TAssetEntry | undefined =>
        this.getAssetsByIdAndType(id, "media");
}
