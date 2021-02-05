/* eslint-disable @typescript-eslint/no-unused-vars */
import {
    TAssetEntry,
    TAssetEntryData,
    TWagtailPageData,
} from "ts/Types/ManifestTypes";
import { IWagtailPage } from "ts/Interfaces/ManifestInterfaces";
import { PublishableItem } from "ts/Implementations/PublishableItem";
import { Asset } from "ts/Implementations/Asset";

// See ts/Typings for the type definitions for these imports
import { BACKEND_BASE_URL } from "js/urls";

export class Page extends PublishableItem<IWagtailPage, TWagtailPageData> {
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    constructor(opts?: any) {
        super(opts);
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
        if (
            !this.meta ||
            !this.data.data ||
            !this.data.id ||
            !this.data.title
        ) {
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

    get updatedResp(): Response {
        return new Response(JSON.stringify(this.data));
    }

    async accessCache(): Promise<boolean> {
        this.cache = await caches.open(this.fullUrl);

        return !!this.cache;
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
        return cacheUpdated && !!(await this.getAssets());
    }

    private assetInitialised(asset: TAssetEntry): boolean {
        return asset.isValid || false;
    }

    async getAsset(asset: TAssetEntryData): Promise<TAssetEntry> {
        // The asset's parentUrl is the same as the cache name
        // See `accessCache` above
        asset.parentUrl = this.fullUrl;
        const pageAsset = new Asset(asset);

        const assetFilled = await pageAsset.initialiseFromCache();
        if (assetFilled) {
            return pageAsset;
        }
        const notInCache = ["prepped:no cache", "loading:no cache"].includes(
            pageAsset.status
        );
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
}
