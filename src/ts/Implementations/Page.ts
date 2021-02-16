/* eslint-disable @typescript-eslint/no-unused-vars */
import { TManifest } from "ts/Types/ManifestTypes";
import { TWagtailPageData } from "ts/Types/PageTypes";
import { TAssetEntry, TAssetEntryData } from "ts/Types/AssetTypes";

import { PublishableItem } from "ts/Implementations/PublishableItem";
import { Asset } from "ts/Implementations/Asset";

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

    constructor(manifest: TManifest, id: string, parent?: Page) {
        super(manifest, id);

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
        return this.manifestData?.version || 0;
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

    get contentType(): string {
        return "application/json";
    }

    /** This will do a basic integrity check.
     * version is not 0, api_url has a value, etc.
     */
    get isValid(): boolean {
        if (!super.isValid) {
            return false;
        }

        if (this.version === 0) {
            return false;
        }

        // Has the wagtail version of this page been loaded
        return !!this.data.data && !!this.data.id && !!this.data.title;
    }

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

    get isPublishable(): boolean {
        if (!super.isPublishable) {
            return false;
        }

        // Compare the number of assets defined in the manifest for this page
        // With the number of actual page objects
        if (this.assets.length !== this.#assets.length) {
            return false;
        }

        if (this.assets.length === 0 && this.#childPages.length === 0) {
            return true;
        }

        // Assets are not publishable on their own,
        // Their isPublishable status is only relevant here
        if (!this.#assets.every((asset) => asset.isPublishable)) {
            return false;
        }

        return this.#childPages.every((childPage) => childPage.isPublishable);
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
            this.status.cacheStatus = "ready";
            this.data = pageData;
        } else {
            this.status.cacheStatus = "prepared";
        }
    }

    get updatedResp(): Response {
        return new Response(JSON.stringify(this.data));
    }

    get cacheKey(): string {
        return this.storage_container;
    }

    async initialiseFromResponse(resp: Response): Promise<boolean> {
        this.data = await resp.json();
        this.status.cacheStatus = "ready";

        // And store the page data in Redux
        storePageData(this.id, this.data);

        // Update the cached paged data
        const cacheUpdated = await this.updateCache();

        await this.loadAssets();

        return cacheUpdated;
    }

    private assetInitialised = (asset: TAssetEntry): boolean =>
        asset.isValid || false;

    async loadAsset(asset: TAssetEntryData): Promise<Asset> {
        // The asset's cache name is the same as the Page's cache name
        const pageAsset = new Asset(
            this.manifest,
            this.id,
            asset.id.toString(),
            this.cacheKey
        );
        const assetFilled = await pageAsset.initialiseFromCache();

        if (assetFilled) {
            return pageAsset;
        }
        const notInCache = ["prepared", "loading"].includes(
            pageAsset.status.cacheStatus
        );
        if (notInCache) {
            if (await pageAsset.initialiseByRequest()) {
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
