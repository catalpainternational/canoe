import { Manifest } from "./Manifest";
import { TWagtailPageData } from "../Types/PageTypes";
import { TAssetEntry } from "../Types/AssetTypes";
import { StorableItem } from "../Interfaces/StorableItem";

import { PublishableItem } from "../Implementations/PublishableItem";
import { Asset } from "../Implementations/Asset";

import Logger from "../Logger";

// See ts/Typings for the type definitions for these imports
import {
    getPageData as getPageDataFromStore,
    storePageData,
    getStoredPageCompletionDate,
    storePageComplete,
} from "ReduxImpl/Interface";
import { persistCompletion } from "js/actions/Completion";
import { persistFeedback } from "js/UserActions";

const logger = new Logger("Page");

export class Page extends PublishableItem implements StorableItem {
    /** id of this asset in the manifest page */
    #id: string;
    /** references to the manifest */
    #manifest: Manifest;
    /** the parent of this page, if it has one */
    #parent: Page | undefined;
    /** the lsit of assets( references stored for efficiency ) */
    #assets: Asset[] = [];
    /** aany data that might wish to be added to a completion persisted entry */
    #completionData: Record<string, any> = {};

    /**
     * Instantiate a new page from its manifest and id
     * @param manifest the manifest this page comes from
     * @param id the id of this page in the manifest
     * @param parent the parent of this page ( if not provided is inferred from manifest on need )
     */
    constructor(manifest: Manifest, id: string, parent?: Page) {
        super();
        this.#id = id;
        this.#manifest = manifest;
        this.#parent = parent;
    }

    get backendPath(): string {
        return this.manifestData?.api_url || "";
    }

    /** The cache in which the page is stored */
    get cacheKey(): string {
        return this.manifestData?.storage_container;
    }

    /** The wagtail page live_revision_id */
    get revisionId(): BigInteger {
        return this.manifestData?.revision_id;
    }

    /** The options to make an page api request */
    get requestOptions(): RequestInit {
        const reqInit: any = {
            credentials: "include",
            cache: "force-cache", // pages have version query params we can rely on the cache
        };
        return reqInit as RequestInit;
    }

    // #region StorableItem implementations
    /** Set the page data in the page store */
    saveToStore(data: TWagtailPageData): void {
        storePageData(this.#id, data);
    }

    /** Get the page data from the page store */
    get storedData(): TWagtailPageData {
        return getPageDataFromStore(this.#id);
    }
    // #endregion StorableItem implementations

    /** Get and store this page, used in routing */
    async prepare(): Promise<void> {
        const response = await this.getResponse();
        return response
            .json()
            .then((manifestData: any) => {
                this.saveToStore(manifestData);
            })
            .catch((err) => {
                logger.warn("%s:%s deserialize %o", this, this.url, err);
                throw new Error("Page failed to deserialize");
            });
    }

    /** Is this item `ready` to be used now!?
     * @remarks Has it been succesfully prepared?
     */
    get ready(): boolean {
        return this.storedData !== undefined;
    }

    /** The data for this page as defined in the manifest */
    get manifestData(): TWagtailPageData {
        return this.#manifest.pages[this.#id] || {};
    }

    /** The data for this page as defined in the manifest
     * @remarks legacy alias for manifestData
     */
    get data(): TWagtailPageData {
        return this.storedData || {};
    }

    get manifest(): Manifest {
        return this.#manifest;
    }

    get childPages(): Page[] {
        return this.children.map(
            (pageId) => this.#manifest.getSpecificPage(pageId, this),
            this.#manifest
        );
    }

    get title(): string {
        return this.manifestData?.title || "";
    }

    get loc_hash(): string {
        return this.manifestData?.loc_hash || "";
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
            (assetEntry: TAssetEntry) => new Asset(this, assetEntry),
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
        return (
            this.manifestData?.tags.map((s: string) => s.toLowerCase()) || []
        );
    }

    /** This will do a basic integrity check. */
    get isValid(): boolean {
        // Has the wagtail version of this page been loaded
        return !!this.manifestData;
    }

    get id(): string {
        return this.#id;
    }

    /** Description for log lines */
    toString(): string {
        return `Page ${this.title}`;
    }

    get isNew(): boolean {
        return (
            this.progressStatus === "not-started" &&
            new Date(this.version / 1000).valueOf() >
                Date.now() - 1000 * 60 * 60 * 24 * 7
        );
    }

    /**
     * Check if the page is in the correct cache
     * @returns `true` if this page, assets, and children is cached in the correct cache, `false` if not
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
     * @returns `true` on success
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
     * @returns `true` on success
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
     * @remarks That is, are they all present in this page's cache. */
    async isPublishable(): Promise<boolean> {
        const promises: Promise<boolean>[] = [
            ...this.manifestAssets.map((asset) => {
                return asset.isAvailableOffline();
            }),
            super.isAvailableOffline(),
        ];
        const results = await Promise.all(promises);

        return results.every((res) => res);
    }

    /** add some data to be stored with the next completion */
    addCompletionData(data: Record<string, any>): void {
        Object.assign(this.#completionData, data);
    }

    /** returns data to be stored with thi page completion */
    get completionData(): Record<string, any> {
        const data = {
            revisionId: this.revisionId,
            version: this.version,
            ...this.#completionData,
        };
        this.#completionData = {};
        return data;
    }

    /** sets a page as complete */
    set complete(complete: boolean) {
        const data = this.completionData;
        data["complete"] = !!complete;
        // store in idb and the server
        const action = persistCompletion(this.id, data);

        // set in redux store
        storePageComplete(this.id, action.date, complete);
    }

    /** if a page has been marked as complete */
    get complete(): boolean {
        return this.completeDate !== undefined;
    }

    /** when a page was last marked as complete */
    get completeDate(): Date | undefined {
        return getStoredPageCompletionDate(this.id);
    }

    /** sets feedback on this page */
    sendFeedback(feedbackData: Record<string, any>): void {
        persistFeedback({
            pageId: this.id,
            revisionId: this.revisionId,
            version: this.version,
            ...feedbackData,
        });
    }

    /** whether this page is notstarted, in progress or complete */
    get progressStatus(): ProgressStatus {
        if (this.complete) {
            return "complete";
        } else if (this.childPages.find((c) => c.complete) === undefined) {
            return "not-started";
        } else {
            return "in-progress";
        }
    }

    /** the data to show in a progress bar for this page */
    get progressValues(): ProgressValues {
        return {
            min: this.childPages.filter((c) => c.complete).length,
            max: this.childPages.length,
        };
    }

    getAssetByIdAndType(
        id: number | string,
        assetType: string
    ): Asset | undefined {
        const asset = this.manifestAssets.find((a: Asset) => {
            return a.id === id.toString() && a.type === assetType;
        });
        if (asset === undefined) {
            logger.warn("Missing asset %s: %s, %s", this.title, id, assetType);
        }
        return asset;
    }

    imageAsset = (id: number | string): Asset | undefined =>
        this.getAssetByIdAndType(id, "image");

    videoAsset = (id: number | string): Asset | undefined =>
        this.getAssetByIdAndType(id, "video");

    audioAsset = (id: number | string): Asset | undefined =>
        this.getAssetByIdAndType(id, "audio");
}

type ProgressStatus = "not-started" | "in-progress" | "complete";
export type ProgressValues = {
    min: number;
    max: number;
};
