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
     * The media url of this asset item
     */
    get url(): string {
        return `${process.env.API_BASE_URL}/media/${this.platformSpecificRendition.path}`;
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
    get requestOptions(): any {
        return {
            cache: "force-cache", // assets are (almost always) invariant on filename
        };
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

    /**
     * Array of renditions for this asset
     */
    get renditions(): Record<string, TRendition> {
        if (this.entry === undefined) {
            throw new Error("Renditions cannot be accessed");
        }
        return this.entry.renditions;
    }

    /**
     * The appropriate rendition for the platform we are running on
     */
    get platformSpecificRendition(): TRendition {
        const browser = getBrowser().name;
        let renditionSpec: string;
        switch (this.type) {
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
                renditionSpec = "original";
                break;
            default:
                renditionSpec = "original";
        }
        if (!this.renditions[renditionSpec]) {
            // Force it back to original if we don't have that rendition
            renditionSpec = "original";
        }
        return this.renditions[renditionSpec];
    }

    /**
     * Description for log lines
     */
    get str(): string {
        return `Asset ${this.id} in ${this.#page.str}`;
    }
}
