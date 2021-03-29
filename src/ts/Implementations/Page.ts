import { Manifest } from "./Manifest";
import { TWagtailPageData } from "../Types/PageTypes";
import { TAssetEntry } from "../Types/AssetTypes";
import { StorableItem } from "../Interfaces/StorableItem";

import { PublishableItem } from "../Implementations/PublishableItem";
import { Asset } from "../Implementations/Asset";

// See ts/Typings for the type definitions for these imports
import {
    getPageData as getPageDataFromStore,
    storePageData,
} from "ReduxImpl/Interface";
import Logger from "../Logger";

const logger = new Logger("Page");

export class Page extends PublishableItem implements StorableItem {
    /** id of this asset in the manifest page */
    #id: string;
    /** references to the manifest */
    #manifest: Manifest;
    /** the parent of this page, if it has one */
    #parent: Page | undefined;
    /** the children of this page ( references stored for efficiency ) */
    #childPages: Page[] | undefined;
    /** the lsit of assets( references stored for efficiency ) */
    #assets: Asset[] = [];

    /**
     * Instantiate a new page from its manifest and id
     * @param manifest the manifest this page comes from
     * @param id the id of this page in the manifest
     * @param parent the parent of this page ( we could infer this but don't yet )
     */
    constructor(manifest: Manifest, id: string, parent?: Page) {
        super();
        this.#id = id;
        this.#manifest = manifest;
        this.#parent = parent;
    }

    /**
     * The api url of this page
     */
    get url(): string {
        return `${process.env.API_BASE_URL}${this.manifestData?.api_url}`;
    }
    /**
     * The cache in which the page is stored
     */
    get cacheKey(): string {
        return this.manifestData?.storage_container;
    }
    /**
     * The options to make an page api request
     */
    get requestOptions(): any {
        return {
            cache: "force-cache", // pages have version query params we can rely on the cache
        };
    }

    /** The data for this page as defined in the manifest */
    get manifestData(): TWagtailPageData {
        return this.#manifest.pages[this.#id] || {};
    }
    /** The data for this page as defined in the manifest
     * legacy alias for manifestData
     */
    get data(): TWagtailPageData {
        return this.manifestData;
    }

    /**
     * Get and store this page, used in routing
     */
    async prepare(): Promise<void> {
        const response = await this.getResponse();
        response
            .json()
            .then((manifestData: any) => {
                this.saveToStore(manifestData);
            })
            .catch((err) => {
                logger.warn("%s:%s deserialize %o", this.str, this.url, err);
                throw new Error("Page failed to deserialize");
            });
    }

    /** Is this item `ready` to be used now!?
     * Has it been succesfully prepared?
     */
    get ready(): boolean {
        return this.storedData !== undefined;
    }

    /** set the page data in the page store */
    saveToStore(data: Record<string, any>): void {
        storePageData(this.#id, data);
    }
    /** get the page data from the page store */
    get storedData(): TWagtailPageData | undefined {
        return getPageDataFromStore(this.#id);
    }

    get manifest(): Manifest {
        return this.#manifest;
    }

    get childPages(): Page[] {
        if (this.#childPages) {
            return this.#childPages;
        }

        this.#childPages = this.children.map(
            (pageId) => this.#manifest.getSpecificPage(pageId, this),
            this.#manifest
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

    get parent(): Page | undefined {
        if (this.#parent) {
            return this.#parent;
        }

        const parentId: string | undefined = Object.keys(
            this.#manifest.pages
        ).find((id: string) => {
            const page = this.#manifest.pages[id];
            return page.children.indexOf(this.#id) !== -1;
        });

        this.#parent = parentId
            ? this.#manifest.getSpecificPage(parentId)
            : undefined;
        return this.#parent;
    }

    get version(): number {
        return this.manifestData?.version;
    }

    get type(): string {
        return this.manifestData?.type || "";
    }

    /** The asset data as defined in the manifest for this page */
    get manifestAssets(): Asset[] {
        return this.manifestData["assets"].map(
            (assetEntry: TAssetEntry) => new Asset(this, assetEntry.id),
            this
        );
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

    get cardImage(): string {
        return this.manifestData?.card_image || "";
    }

    get tags(): string[] {
        return this.manifestData?.tags || [];
    }

    /** This will do a basic integrity check.
     */
    get isValid(): boolean {
        // Has the wagtail version of this page been loaded
        return !!this.manifestData;
    }

    get id(): string {
        return this.#id;
    }

    /**
     * Check if the page is in the correct cache
     * @returns true if this page, assets, and children is cached in the correct cache , false if not
     */
    async isAvailableOffline(): Promise<boolean> {
        const promises: Promise<boolean>[] = [
            ...this.manifestAssets.map((asset) => {
                return asset.isAvailableOffline();
            }),
            ...this.childPages.map((page) => {
                return page.isAvailableOffline();
            }),
            super.isAvailableOffline(),
        ];
        return Promise.all(promises).then((results) =>
            results.every((result) => result)
        );
    }
    /**
     * Add this page, assets, and children to the correct cache
     * @returns true if succeeds
     */
    async makeAvailableOffline(): Promise<boolean> {
        const promises: Promise<boolean>[] = [
            ...this.manifestAssets.map((asset) => {
                return asset.makeAvailableOffline();
            }),
            ...this.childPages.map((page) => {
                return page.makeAvailableOffline();
            }),
            super.makeAvailableOffline(),
        ];
        return Promise.all(promises).then((results) =>
            results.every((result) => result)
        );
    }
    /**
     * Remove this page, assets, and children from the cache
     * @returns true if succeds
     */
    async removeAvailableOffline(): Promise<boolean> {
        const promises: Promise<boolean>[] = [
            ...this.manifestAssets.map((asset) => {
                return asset.removeAvailableOffline();
            }),
            ...this.childPages.map((page) => {
                return page.removeAvailableOffline();
            }),
            super.removeAvailableOffline(),
        ];
        return Promise.all(promises).then((results) =>
            results.every((result) => result)
        );
    }

    /** A page isPublishable if it, and all of its assets, are publishable.
     * That is, are they all present in this page's cache. */
    isPublishable(): Promise<boolean> {
        const promises: Promise<boolean>[] = [
            ...this.manifestAssets.map((asset) => {
                return asset.isAvailableOffline();
            }),
            super.isAvailableOffline(),
        ];
        return Promise.all(promises).then((results) =>
            results.every((result) => result)
        );
    }

    getAssetsByIdAndType(
        id: number | string,
        assetType: string
    ): TAssetEntry | undefined {
        const assets = this.manifestData.assets;
        const filteredAssets = assets.find((a: TAssetEntry) => {
            return a.id === id.toString() && a.type === assetType;
        });
        // Handy code if you want to check what assets are being retrieved
        // console.log(
        //     `Getting ${assetType} asset:${id}, and found ${JSON.stringify(
        //         filteredAssets
        //     )}`
        // );
        return filteredAssets;
    }

    getImageRenditions = (id: number | string): TAssetEntry | undefined =>
        this.getAssetsByIdAndType(id, "image");

    getMediaRenditions = (id: number | string): TAssetEntry | undefined =>
        this.getAssetsByIdAndType(id, "media");

    getVideoRenditions = (id: number | string): TAssetEntry | undefined =>
        this.getAssetsByIdAndType(id, "video");

    getAudioRenditions = (id: number | string): TAssetEntry | undefined =>
        this.getAssetsByIdAndType(id, "audio");

    get str(): string {
        return `Page ${this.title}`;
    }
}
