import { Page } from "./Page";
import { TAssetEntry, TRendition } from "../Types/AssetTypes";
import { PublishableItem } from "./PublishableItem";

import {
    JPEG_RENDITION,
    MP4A_RENDITION,
    MP4V_RENDITION,
    OPUS_RENDITION,
    WEBM_RENDITION,
    WEBP_RENDITION,
} from "../Constants";
import { getBrowser } from "../PlatformDetection";

// See ts/Typings for the type definitions for these imports
import { BACKEND_BASE_URL } from "js/urls";

/** A asset ( binary resource ) than can be cached
 */
export class Asset extends PublishableItem {
    /** id of this asset in the manifest page */
    #id: string;
    /** reference to the parent page (used to point to the correct cache) */
    #page: Page;
    /** stored reference to the Asset details */
    #entry: TAssetEntry | undefined;

    /**
     * Instantiate a new asset from its page and id
     * @param page the page this asset is associated with
     * @param id the id of this asset
     */
    constructor(page: Page, id: string) {
        super();
        this.#page = page;
        this.#id = id;
    }

    /**
     * The platform specific media url of this asset item
     */
    get url(): string {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return Asset.url(this!.entry as TAssetEntry);
    }

    /**
     * The platform specific media url of this asset item
     */
    static url(asset: TAssetEntry): string {
        const assetPath = Asset.platformSpecificRendition(asset)?.path || "";
        return assetPath
            ? `${process.env.API_BASE_URL}/media/${assetPath}`
            : "";
    }

    /**
     * The cache in which the asset is stored
     * Currently uses the page cache
     */
    get cacheKey(): string {
        return this.#page.cacheKey;
    }

    /**
     * The options to make an asset request
     */
    get requestOptions(): RequestInit {
        const headers: any = {
            "Content-Type": this.contentType,
        };

        return {
            cache: "force-cache", // assets are (almost always) invariant on filename
            headers: headers,
            method: "GET",
            mode: "cors",
            referrer: BACKEND_BASE_URL,
        } as RequestInit;
    }

    /**
     * The data from the manifest about this asset
     */
    get entry(): TAssetEntry | undefined {
        if (!this.#entry) {
            this.#entry = this.#page.manifestData.assets.find(
                (a: any) => a["id"] === this.#id
            );
        }
        return this.#entry;
    }

    /**
     * The id of this asset in the manifest page entry
     */
    get id(): string {
        return this.#id;
    }

    /**
     * The type of this asset (image|video|audio)
     */
    get type(): string | undefined {
        return this.entry?.type;
    }

    /** The mime type of this asset */
    get contentType(): string {
        const browser = getBrowser().name;
        switch (this.type) {
            case "image":
                return browser === "Safari" ? "image/jpeg" : "image/webp";
            case "video":
                // Safari does support webm to a limited degree
                return browser === "Safari" ? "video/mp4" : "video/webm";
            case "audio":
                return browser === "Safari" ? "audio/ogg" : "audio/mp4";
            default:
                // Default is for JSON, and we don't care about the browser
                return "application/json";
        }
    }

    /**
     * Array of renditions for this asset
     */
    get renditions(): Record<string, TRendition> {
        if (Object.keys(this?.entry?.renditions || {}).length === 0) {
            throw new Error("Renditions cannot be accessed");
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return this!.entry!.renditions;
    }

    /**
     * Description for log lines
     */
    get str(): string {
        return `Asset ${this.id} in ${this.#page.str}`;
    }

    /**
     * The appropriate rendition for the platform we are running on
     */
    get platformSpecificRendition(): TRendition {
        if (Object.keys(this?.entry?.renditions || {}).length === 0) {
            throw new Error("Renditions cannot be accessed");
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return Asset.platformSpecificRendition(this!.entry as TAssetEntry);
    }

    static platformSpecificRendition(asset: TAssetEntry): TRendition {
        const browser = getBrowser().name;
        let renditionSpec: string;
        switch (asset.type) {
            case "image":
                renditionSpec =
                    browser === "Safari" ? JPEG_RENDITION : WEBP_RENDITION;
                break;
            case "video":
                renditionSpec =
                    browser === "Safari" ? MP4V_RENDITION : WEBM_RENDITION;
                break;
            case "audio":
                renditionSpec =
                    browser === "Safari" ? OPUS_RENDITION : MP4A_RENDITION;
                break;
            case "pdf":
                // We currently do not need this case (although it is technically accurate)
                // however it would be nice to have it available in the near future
                renditionSpec = "original";
                break;
            default:
                renditionSpec = "original";
        }
        while (!(renditionSpec in asset.renditions)) {
            if (!renditionSpec.startsWith("original")) {
                // Force it back to original if we don't have that rendition
                renditionSpec = "original";
                continue;
            } else if (
                renditionSpec === "original" &&
                ["audio", "video"].includes(asset.type)
            ) {
                // Force it to original + asset.type
                renditionSpec = `original-${asset.type}`;
                continue;
            }
            // Not found - throw
            throw new Error(
                "Renditions (optimised or original) cannot be accessed"
            );
        }

        return asset.renditions[renditionSpec];
    }
}
