/* eslint-disable @typescript-eslint/no-unused-vars */
import { TManifest } from "ts/Types/ManifestTypes";
import { TAssetEntry } from "ts/Types/AssetTypes";
import { PublishableItem } from "ts/Implementations/PublishableItem";

import { AppelflapConnect } from "ts/AppelflapConnect";
import { JPEG_RENDITION, WEBP_BROWSERS, WEBP_RENDITION } from "ts/Constants";
import { getBrowser } from "ts/PlatformDetection";

// See ts/Typings for the type definitions for these imports
import { BACKEND_BASE_URL } from "js/urls";

export class Asset extends PublishableItem<TAssetEntry> {
    #blob?: Blob;
    /** The cache of the parent page (used to point to the correct cache) */
    #pageCache: string;
    /** This asset's parent Id within the manifest definition for its parent */
    #pageId: string;

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    constructor(
        manifest: TManifest,
        pageId: string,
        id: string,
        statusId: string,
        pageCache: string
    ) {
        super(manifest, id, statusId);

        this.#pageId = pageId;
        this.#pageCache = pageCache;
    }

    /** Assets don't have a version as such,
     * we set them to a +ve value if they are `ready`.
     * This ensure that isAvailableOffline will work correctly. */
    get version(): number {
        return this.ready ? 1 : -1;
    }

    get pageId(): string {
        return this.#pageId;
    }

    get type(): string {
        return this.manifestData?.type || "";
    }

    get renditions(): Record<string, string> {
        return this.manifestData?.renditions || {};
    }

    get platformSpecificRendition(): string {
        return getBrowser().name === "Safari" ? JPEG_RENDITION : WEBP_RENDITION;
    }

    get manifestData(): TAssetEntry {
        const parentPage = this.manifest?.pages[this.pageId];
        if (!parentPage) {
            return this.emptyItem;
        }

        const asset = parentPage?.assets.find(
            (asset) => asset.id.toString() === this.id.toString()
        );

        return asset || this.emptyItem;
    }

    /** The url of the rendition that is most relevant to this platform */
    get rendition(): string {
        const renditionType = this.platformSpecificRendition;
        const rendition = this.renditions[renditionType];

        if (!rendition) {
            // Do NOT throw a MissingImageError here
            // because it will silently screw up the rest of the asset instantiation
            return "";
        }

        return rendition;
    }

    /** Alias for rendition, always prefixed with a '/' */
    get api_url(): string {
        let rend = this.rendition || "";
        if (rend && !rend.startsWith("/")) {
            rend = `/${rend}`;
        }
        return rend;
    }

    get fullUrl(): string {
        return `${BACKEND_BASE_URL}/media${this.api_url}`;
    }

    get contentType(): string {
        let contentType = "application/json";
        if (this.type === "image") {
            const browser = getBrowser().name;
            contentType =
                WEBP_BROWSERS.indexOf(browser) >= 0
                    ? "image/webp"
                    : "image/jpeg";
        }

        return contentType;
    }

    /** An Asset is not publishable on its own.
     * So its isPublishable value is only relevant to its parent page.
     */
    get isPublishable(): boolean {
        return super.isPublishable;
    }

    get emptyItem(): TAssetEntry {
        const empty = super.emptyItem;

        empty.id = "";
        empty.type = "";
        empty.renditions = {};

        return empty;
    }

    GetDataFromStore(): void {
        // Does almost nothing, assets are only stored in the cache
        this.status.storeStatus = "ready";
    }

    StoreDataToStore(): void {
        // Does almost nothing, assets are only stored in the cache
        this.status.storeStatus = "ready";
    }

    get updatedResp(): Response {
        return new Response(this.#blob);
    }

    get cacheKey(): string {
        return this.#pageCache || "";
    }

    async initialiseFromResponse(resp: Response): Promise<boolean> {
        this.#blob = await resp.blob();
        this.status.cacheStatus = "ready";

        const cacheUpdated = await this.updateCache();
        return cacheUpdated && !!this.#blob;
    }

    /** Tells Appelflap to (not) publish this Asset's entry in the cache
     * @returns
     * - resolve(false) because Assets cannot be published on their own
     */
    async publish(appelflapConnect: AppelflapConnect): Promise<boolean> {
        return Promise.resolve(false);
    }
}
