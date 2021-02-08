/* eslint-disable @typescript-eslint/no-unused-vars */
import {
    TAssetEntry,
    TAssetEntryData,
    TManifest,
    TWagtailPageData,
} from "ts/Types/ManifestTypes";
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
            (pageId) => this.manifest.getSpecificPage(pageId.toString(), this),
            this.manifest
        );
        return this.#childPages;
    }

    get ready(): boolean {
        return !!this.status && this.status.startsWith("ready");
    }

    get title(): string {
        return this.manifestData?.title || "";
    }

    get loc_hash(): string {
        return this.manifestData?.loc_hash || "";
    }

    /** The data for this page as defined in the manifest */
    get manifestData(): any {
        return this.manifest.pages[this.id];
    }

    get parent(): Page | undefined {
        if (this.#parent) {
            return this.#parent;
        }

        const parentId: string | undefined = Object.keys(
            this.manifest.pages
        ).find((id: string) => {
            const page = this.manifest.pages[id];
            return page.children.indexOf(parseInt(this.id)) !== -1;
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

    get children(): Array<number> {
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
        if (!this.data.data || !this.data.id || !this.data.title) {
            return false;
        }

        // Is the page's source acceptable
        if (["unset", "store"].includes(this.source)) {
            return false;
        }

        return true;
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
        // so we test that they are availableOffline
        const allAssetsAvailableOffline = this.#assets.every(
            (asset) => this.assetInitialised(asset) && asset.isAvailableOffline
        );
        if (!allAssetsAvailableOffline) {
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
        const pageData = getPageDataFromStore(parseInt(this.id));
        if (pageData) {
            this.status = "ready";
            this.data = pageData;
        } else {
            this.status = "prepped";
        }
    }

    get updatedResp(): Response {
        return new Response(JSON.stringify(this.data));
    }

    get cacheKey(): string {
        return this.fullUrl;
    }

    async initialiseFromResponse(resp: Response): Promise<boolean> {
        this.data = await resp.json();
        this.status = "ready";

        // And store the page data in Redux
        storePageData(parseInt(this.id), this.data);

        // Update the cached paged data
        const cacheUpdated = await this.updateCache();

        await this.loadAssets();

        return cacheUpdated;
    }

    private assetInitialised(asset: TAssetEntry): boolean {
        return asset.isValid || false;
    }

    async loadAsset(asset: TAssetEntryData, index: number): Promise<Asset> {
        // The asset's parentUrl is the same as the cache name
        // (which is the same as this page's full url)
        // See `cacheKey` above
        asset.parentUrl = this.fullUrl;
        const pageAsset = new Asset(this.manifest, this.id, index);
        pageAsset.parentUrl = this.fullUrl;
        const assetFilled = await pageAsset.initialiseFromCache();

        if (assetFilled) {
            return pageAsset;
        }
        const notInCache = ["prepped", "loading"].includes(pageAsset.status);
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
                const asset = await this.loadAsset(this.manifestAssets[ix], ix);
                this.#assets.push(asset);
            } catch {
                // Could not fill the asset
            }
        }
    }

    PETEgetImageRenditions(id: number): string {
        const assets = this.manifestData.assets;
        return assets.find((a: any) => {
            return a.id === id && a.type === "image";
        });
    }
    PETEgetMediaRenditions(id: number): string {
        const assets = this.manifestData.assets;
        return assets.find((a: any) => {
            return a.id === id && a.type === "media";
        });
    }
}
