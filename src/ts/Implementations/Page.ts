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
    pageData!: TWagtailPageData;
    #status!: string;
    #childPages: Page[];

    constructor(manifest: TManifest, id: string) {
        super(manifest, id);

        // Populate the parent and childPages members
        // with the first call to their respective getter methods
        this.#parent = this.parent;
        this.#childPages = this.childPages;
    }

    get childPages(): Page[] {
        if (this.childPages) {
            return this.childPages;
        }

        this.#childPages = this.children.map(
            (pageId) => this.manifest.getSpecificPage(pageId, this),
            this.manifest
        );
        return this.#childPages;
    }

    get ready(): boolean {
        return !!this.#status && this.#status.startsWith("ready");
    }

    get title(): string {
        return this.manifestData?.title || "";
    }

    get loc_hash(): string {
        return this.manifestData?.loc_hash || "";
    }

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
            const page = this.manifest.pages[parseInt(id)];
            return page.children.indexOf(parseInt(this.id)) !== -1;
        });

        this.#parent = parentId
            ? this.manifest.getSpecificPage(parseInt(parentId))
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
        if (!super.isPublishable) {
            return false;
        }

        if (this.assets.length > 0) {
            return this.assets.every(
                (asset) =>
                    this.assetInitialised(asset) &&
                    (asset as Asset).status === "ready"
            );
        }

        return true;
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
        const cacheUpdated = await this.updateCache();

        storePageData(pageData.id, pageData);
        return cacheUpdated && !!(await this.getAssets());
    }

    private assetInitialised(asset: TAssetEntry): boolean {
        return asset.isValid || false;
    }

    async getAsset(asset: TAssetEntryData): Promise<TAssetEntry> {
        // The asset's parentUrl is the same as the cache name
        // (which is the same as this page's full url)
        // See `cacheKey` above
        asset.parentUrl = this.fullUrl;
        const pageAsset = new Asset(this.manifest, this.id);
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

        return this.assets;
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
