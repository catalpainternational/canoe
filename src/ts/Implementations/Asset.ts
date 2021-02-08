/* eslint-disable @typescript-eslint/no-unused-vars */
import { TAssetEntry, TManifest } from "ts/Types/ManifestTypes";
import { PublishableItem } from "ts/Implementations/PublishableItem";

import { JPEG_RENDITION, WEBP_BROWSERS, WEBP_RENDITION } from "ts/Constants";
import { getBrowser } from "ts/PlatformDetection";

// See ts/Typings for the type definitions for these imports
import { BACKEND_BASE_URL } from "js/urls";
import { MissingImageError } from "js/Errors";

export class Asset extends PublishableItem<TAssetEntry> {
    #blob?: Blob;
    /** This asset's index within the manifest definition for its parent page */
    #assetIndex: number;

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    constructor(manifest: TManifest, pageId: string, index: number) {
        super(manifest, pageId);
        this.#assetIndex = index;
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
        return this.manifest?.pages[this.id]?.assets[this.#assetIndex] || {};
    }

    /** The url of the rendition that is most relevant to this platform */
    get rendition(): string {
        const renditionType = this.platformSpecificRendition;
        const rendition = this.renditions[renditionType];

        if (!rendition) {
            const error = `${renditionType} image doesn't exist.
            Renditions: ${JSON.stringify(this.renditions)}`;
            throw new MissingImageError(error);
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

    /** This will do a basic integrity check.
     */
    get isValid(): boolean {
        if (!super.isValid) {
            return false;
        }

        // Is the asset's source acceptable
        if (["unset", "store"].includes(this.source)) {
            return false;
        }

        return true;
    }

    get isAvailableOffline(): boolean {
        return super.isAvailableOffline;
    }

    /** Always returns false, an Asset is not publishable on its own */
    get isPublishable(): boolean {
        return false;
    }

    get emptyItem(): TAssetEntry {
        const empty = super.emptyItem;

        empty.type = "";
        empty.renditions = {};

        return empty;
    }

    GetDataFromStore(): void {
        // Does nothing, assets are only stored in the cache
    }

    get updatedResp(): Response {
        return new Response(this.#blob);
    }

    get cacheKey(): string {
        return this.data.parentUrl;
    }

    async initialiseFromResponse(resp: Response): Promise<boolean> {
        this.#blob = await resp.blob();

        const cacheUpdated = await this.updateCache();
        return cacheUpdated && !!this.#blob;
    }
}
