import { Page } from "./Page";
import { TAssetEntry, TRendition } from "../Types/AssetTypes";
import { PublishableItem } from "./PublishableItem";

import {
    JPEG_RENDITION,
    WEBP_RENDITION,
    ORIG_V_RENDITION,
    H264_360P_RENDITION,
    H264_480P_RENDITION,
    H265_360P_RENDITION,
    H265_480P_RENDITION,
    VP9_360P_RENDITION,
    VP9_480P_RENDITION,
    WEBM_RENDITION,
    ORIG_A_RENDITION,
    OPUS_RENDITION,
    ORIG_RENDITION,
} from "../Constants";
import { getBrowser } from "../PlatformDetection";

// See ts/Typings for the type definitions for these imports
import { BACKEND_BASE_URL } from "js/urls";

/** This is a subjective in-order list of the above rendition IDs
 * Its intended use is to be intersected with an array of available renditions
 * for a given asset, to then get that asset's list of available renditions in
 * order according to subjective quality / size
 */
const RENDITION_PREFERENCE = [
    VP9_480P_RENDITION,
    VP9_360P_RENDITION,
    H264_480P_RENDITION,
    H264_360P_RENDITION,
    H265_480P_RENDITION,
    H265_360P_RENDITION,
    WEBM_RENDITION,
    ORIG_V_RENDITION,
    OPUS_RENDITION,
    ORIG_A_RENDITION,
    WEBP_RENDITION,
    JPEG_RENDITION,
    ORIG_RENDITION,
];

/** A subjective size difference value,
 * whereby we will take the preferred rendition over the smallest rendition */
const SIZE_DIFF_PERCENT = 0.02;

/** An asset ( binary resource ) than can be cached */
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

    /** The platform specific media url of this asset item */
    get backendPath(): string {
        const assetPath =
            Asset.platformSpecificRendition(this.assetEntry)?.path || "";
        return assetPath ? `/media/${assetPath}` : "";
    }

    /**
     * The cache in which the asset is stored
     * @remarks Currently uses the page cache
     */
    get cacheKey(): string {
        return this.#page.cacheKey;
    }

    /** The options to make an asset request */
    get requestOptions(): RequestInit {
        return {
            cache: "force-cache", // assets are (almost always) invariant on filename
        } as RequestInit;
    }

    /** The data from the manifest about this asset */
    get entry(): TAssetEntry | undefined {
        if (!this.#entry) {
            this.#entry = this.#page.manifestData.assets.find(
                (a: any) => a["id"] === this.#id
            );
        }
        return this.#entry;
    }

    /** The id of this asset in the manifest page entry */
    get id(): string {
        return this.#id;
    }

    /** The type of this asset (image|video|audio) */
    get type(): string | undefined {
        return this.entry?.type;
    }

    /** Array of renditions for this asset */
    get renditions(): Record<string, TRendition> {
        if (Object.keys(this?.entry?.renditions || {}).length === 0) {
            throw new Error("Renditions cannot be accessed");
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return this.assetEntry!.renditions;
    }

    /** Description for log lines */
    toString(): string {
        return `Asset ${this.id} in ${this.#page}`;
    }

    /** The appropriate rendition for the platform we are running on */
    get platformSpecificRendition(): TRendition {
        if (Object.keys(this?.entry?.renditions || {}).length === 0) {
            throw new Error("Renditions cannot be accessed");
        }
        return Asset.platformSpecificRendition(this.assetEntry);
    }

    get assetEntry(): TAssetEntry {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return this!.entry as TAssetEntry;
    }

    static platformSpecificRendition(asset: TAssetEntry): TRendition {
        const browser = getBrowser().name;
        let rendDefs: string[];
        let rendCount = 0;
        switch (asset.type) {
            case "image":
                rendDefs =
                    browser === "Safari" ? [JPEG_RENDITION] : [WEBP_RENDITION];
                break;
            case "video":
                rendDefs = [
                    ORIG_V_RENDITION,
                    H264_360P_RENDITION,
                    H264_480P_RENDITION,
                ];
                rendCount = rendDefs.length;
                switch (browser) {
                    case "Chrome": // and 'Edge'
                        rendDefs.splice(
                            rendCount,
                            0,
                            VP9_360P_RENDITION,
                            VP9_480P_RENDITION,
                            WEBM_RENDITION
                        );
                        break;
                    case "Firefox":
                        rendDefs.splice(rendCount, 0, WEBM_RENDITION);
                        break;
                    case "Safari":
                        rendDefs.splice(
                            rendCount,
                            0,
                            H265_360P_RENDITION,
                            H265_480P_RENDITION
                        );
                        break;
                }
                break;
            case "audio":
                rendDefs = [ORIG_A_RENDITION];
                if (browser !== "Safari") {
                    rendDefs.splice(rendCount, 0, OPUS_RENDITION);
                }
                break;
            case "pdf":
                // We currently do not need this case (although it is technically accurate)
                // however it would be nice to have it available in the near future
                rendDefs = [ORIG_RENDITION];
                break;
            default:
                rendDefs = [ORIG_RENDITION];
                break;
        }

        const renditionSpecs = rendDefs.filter(
            (def) => def in asset.renditions
        );
        if (renditionSpecs.length === 0) {
            // Not found - throw
            throw new Error(
                "Renditions (optimised or original) cannot be accessed"
            );
        }
        if (renditionSpecs.length === 1) {
            // Only one rendition available, so no need for any further work, just return it
            return asset.renditions[renditionSpecs[0]];
        }

        // Get the available renditions in a 'preferred' order
        const prefRenditionSpecs = RENDITION_PREFERENCE.filter((pref) =>
            renditionSpecs.includes(pref)
        );

        const hasSize = prefRenditionSpecs.every((pref) =>
            Object.prototype.hasOwnProperty.call(asset.renditions[pref], "size")
        );
        if (!hasSize) {
            // We can't compare size, so just return the first 'preferred' rendition
            return asset.renditions[prefRenditionSpecs[0]];
        }

        // Get the available renditions in order of size (smallest to largest)
        const sizedRenditionSpecs = renditionSpecs.sort(
            (a, b) =>
                (asset.renditions[a].size as number) -
                (asset.renditions[b].size as number)
        );

        // Compare 'preferred' to size
        if (prefRenditionSpecs[0] === sizedRenditionSpecs[0]) {
            // They agree
            return asset.renditions[prefRenditionSpecs[0]];
        }
        // Size difference as a percent
        const sizeDiff =
            (asset.renditions[sizedRenditionSpecs[0]].size as number) /
            (asset.renditions[prefRenditionSpecs[0]].size as number);
        if (1 - sizeDiff < SIZE_DIFF_PERCENT) {
            // Within 2% (subjective), close enough
            return asset.renditions[prefRenditionSpecs[0]];
        }

        // Return the smallest then
        return asset.renditions[prefRenditionSpecs[0]];
    }

    get metadata(): Record<string, any> {
        return this.#page.manifest.storedData?.videometa[this.id];
    }

    get thumbnail(): string {
        return this.metadata && this.metadata.thumbnail
            ? `${BACKEND_BASE_URL}/${this.metadata.thumbnail}`
            : "";
    }

    get duration(): number {
        return this.metadata && this.metadata.duration
            ? this.metadata.duration
            : 0;
    }
}
