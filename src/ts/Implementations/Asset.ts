/* eslint-disable @typescript-eslint/no-unused-vars */
import { TAssetEntry, TPageData } from "ts/Types/ManifestTypes";
import { TAssetStatus } from "ts/Types/CanoeEnums";
import { JPEG_RENDITION, WEBP_BROWSERS, WEBP_RENDITION } from "ts/Constants";
import { getBrowser } from "ts/PlatformDetection";

// See ts/Typings for the type definitions for these imports
import { getAuthenticationToken } from "js/AuthenticationUtilities";
import { BACKEND_BASE_URL } from "js/urls";
import { MissingImageError } from "js/Errors";

export class Asset implements TAssetEntry {
    data!: TAssetEntry;
    #contentType?: any;
    #blob?: any;
    #status!: TAssetStatus;

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    constructor(opts?: any) {
        this.#status = "unset";
        if (!this.data) {
            this.data = Asset.emptyItem;
            this.#status = "empty";
        }
        if (typeof opts === "undefined") {
            return;
        }
        if (typeof opts === "string") {
            this.data.api_url = opts;
            this.#status = "prepped:type";
        } else if (opts as TPageData) {
            this.clone(opts);
            this.#status = "prepped:manifest";
        }
        if (this.data.dataUri) {
            this.#status = "loading:cache";
            const blobSplit = this.data.dataUri.split(",");
            this.#blob = atob(blobSplit[1]);
            this.#contentType = blobSplit[0]
                .replace("data:", "")
                .replace(";base64", "");
            this.#status = "ready:cache";
        }

        return this.data.dataUri;
    }

    get type(): string {
        return this.data?.type || "";
    }

    get renditions(): Record<string, string> {
        return this.data?.renditions || {};
    }

    get platformSpecificRendition(): string {
        return getBrowser().name === "Safari" ? JPEG_RENDITION : WEBP_RENDITION;
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

    get dataUri(): string {
        return this.data.dataUri || "";
    }

    /** This will do a basic integrity check.
     */
    get isValid(): boolean {
        // Is the asset's status acceptable
        if (
            [
                "unset",
                "empty",
                "prepped:no cache",
                "prepped:no type",
                "prepped:no fetch",
            ].includes(this.#status)
        ) {
            return false;
        }

        return true;
    }

    get isAvailableOffline(): boolean {
        if (!this.isValid) {
            return false;
        }

        // Is the page's status acceptable
        if (!this.#status.startsWith("ready")) {
            return false;
        }

        return true;
    }

    /** Always returns false, an Asset is not publishable on its own */
    get isPublishable(): boolean {
        return false;
    }

    get status(): string {
        return this.#status;
    }

    static get emptyItem(): TAssetEntry {
        return {
            type: "",
            renditions: {},
            isValid: false,
            isAvailableOffline: false,
            isPublishable: false,
        };
    }

    clone(data: TAssetEntry): void {
        this.data = JSON.parse(JSON.stringify(data));
    }

    async initialiseFromResponse(resp: Response): Promise<void> {
        this.#blob = await resp.blob();
        this.data.dataUri = `data:${this.#contentType};base64,${btoa(
            this.#blob
        )}`;
    }

    async initialiseByRequest(): Promise<boolean> {
        this.#status = "loading:fetch";

        this.#contentType = "application/json";
        if (this.type === "image") {
            this.#contentType =
                getBrowser().name in WEBP_BROWSERS
                    ? "image/webp"
                    : "image/jpeg";
        }
        // Need to add the "media" types we'll support

        const reqInit: RequestInit = {
            mode: "cors",
            method: "GET",
            headers: {
                "Content-Type": this.#contentType,
                Authorization: `JWT ${getAuthenticationToken()}`,
            },
        };
        const resp = await fetch(this.fullUrl, reqInit);

        if (resp.ok) {
            await this.initialiseFromResponse(resp);
            this.#status = "ready:fetch";
        } else {
            this.#status = "prepped:no fetch";
        }

        return true;
    }
}
