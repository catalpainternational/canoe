/* eslint-disable @typescript-eslint/no-unused-vars */
import { TManifestData } from "ts/Types/ManifestTypes";
import { TWagtailPage } from "ts/Types/PageTypes";

import { PublishableItem } from "ts/Implementations/PublishableItem";
import { Page } from "ts/Implementations/Page";
import { UpdateCachedItem } from "ts/Implementations/CacheItem";

import AllCoursesPage from "ts/Implementations/Specific/AllCoursesPage";
import CoursePage from "ts/Implementations/Specific/CoursePage";
import LessonPage from "ts/Implementations/Specific/LessonPage";
import ResourcesRootPage from "ts/Implementations/Specific/ResourcesRootPage";
import ResourcePage from "ts/Implementations/Specific/ResourcePage";

import { MANIFEST_CACHE_NAME } from "ts/Constants";

// See ts/Typings for the type definitions for these imports
import { ROUTES_FOR_REGISTRATION } from "js/urls";
import { storeManifest, getManifestFromStore } from "ReduxImpl/Interface";

class ManifestError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ManifestError";
    }
}

export const ManifestAPIURL = "/manifest/v1";

export class Manifest extends PublishableItem<TManifestData> {
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    constructor(opts?: any) {
        super(opts, "", MANIFEST_CACHE_NAME);
    }

    get pages(): Record<string, TWagtailPage> {
        return this.data?.pages || {};
    }

    get isInitialised(): boolean {
        return !!this.data?.pages;
    }

    get version(): number {
        return this.data?.version || -1;
    }

    set version(value: number) {
        if (this.data) {
            this.data.version = value;
        }

        super.version = value;
    }

    get api_url(): string {
        return ManifestAPIURL;
    }

    get fullUrl(): string {
        return ROUTES_FOR_REGISTRATION.manifest;
    }

    get manifestData(): TManifestData {
        return this;
    }

    get contentType(): string {
        return "application/json";
    }

    /** This ensures that:
     * - All child pages have matching page entries
     */
    get childPagesValid(): boolean {
        const allPageNames = new Set(Object.keys(this.pages));
        let childPageNames: Set<string> = new Set();
        allPageNames.forEach((pageName) => {
            childPageNames = new Set([
                ...childPageNames,
                ...this.pages[pageName].children,
            ]);
        });
        const unMatchedChildren = new Set(
            [...childPageNames].filter((x) => !allPageNames.has(x))
        );

        return !unMatchedChildren.size;
    }

    /** This is a basic integrity check.  It ensures that:
     * - This item has a valid statusId (api_url)
     * - The store and cache status values are acceptable
     * - It has been initialised (it has a `data` value)
     * - All child pages have matching page entries
     */
    get isValid(): boolean {
        if (!super.isValid) {
            return false;
        }

        if (!this.isInitialised) {
            return false;
        }

        return this.childPagesValid;
    }

    get isAvailableOffline(): boolean {
        return this.isValid;
    }

    get isPublishable(): boolean {
        return this.isValid;
    }

    get languageCodes(): string[] {
        if (!this.isInitialised) {
            return [];
        }

        const languageCodes = new Set(
            Object.values(this.pages).map((page: any) => {
                return page.languageCode as string;
            })
        );

        return [...languageCodes];
    }

    get emptyItem(): TManifestData {
        const empty = super.emptyItem;

        empty.id = "";
        empty.api_url = ManifestAPIURL;
        empty.version = -1;
        empty.pages = {};

        return empty;
    }

    GetDataFromStore(): void {
        const manifest = getManifestFromStore();
        if (manifest && JSON.stringify(manifest) !== "{}") {
            this.data = manifest;
            this.status.storeStatus = "ready";
        } else {
            this.status.storeStatus = "unset";
        }
    }

    StoreDataToStore(): void {
        // And store the manifest data in Redux
        this.status.storeStatus = "unset";
        storeManifest(this.data);
        this.status.storeStatus = "ready";
    }

    get updatedResp(): Response {
        return new Response(JSON.stringify(this.data));
    }

    get cacheKey(): string {
        return this.fullUrl;
    }

    BuildManifestData(response: Record<string, any>): void {
        const respData: Partial<TManifestData> = response;
        if (respData) {
            this.data = this.emptyItem;
            this.data.id = "";
            this.data.api_url = ManifestAPIURL;
            Object.keys(respData).forEach((key) => {
                this.data[key] = respData[key];
            });
        }
    }

    async initialiseFromResponse(resp: Response): Promise<boolean> {
        try {
            this.BuildManifestData(await resp.json());
        } catch {
            // Discard errors with getting json from response
            // eslint-disable-next-line no-console
            console.info(
                "Manifest in the Response (cache or network) could not be parsed."
            );
        }

        const isAcceptable =
            this.statusIdValid &&
            this.cacheStatusAcceptable &&
            this.isInitialised &&
            this.childPagesValid;

        let cacheUpdated = false;
        if (this.data && isAcceptable) {
            this.StoreDataToStore();
            cacheUpdated = await UpdateCachedItem(this);
        }

        return cacheUpdated && this.isValid;
    }

    getPageManifestData(locationHash: string): Page | undefined {
        const pageId: string | undefined = Object.keys(this.data.pages).find(
            (pageId: string) => {
                const page = this.data.pages[pageId];
                return page.loc_hash === locationHash;
            }
        );
        if (pageId === undefined) {
            throw new ManifestError("location not found in manifest");
        }
        return this.getSpecificPage(pageId);
    }

    getSpecificPage(pageId: string, parent?: Page): Page {
        const pageType = this.data.pages[pageId].type;
        const pageStatusId = this.data.pages[pageId].storage_container;

        switch (pageType) {
            case "homepage":
                return new AllCoursesPage(this, pageId, pageStatusId, parent);
            case "coursepage":
                return new CoursePage(this, pageId, pageStatusId, parent);
            case "lessonpage":
                return new LessonPage(this, pageId, pageStatusId, parent);
            case "resourcesroot":
                return new ResourcesRootPage(
                    this,
                    pageId,
                    pageStatusId,
                    parent
                );
            case "resourcearticle":
                return new ResourcePage(this, pageId, pageStatusId, parent);
            default:
                return new Page(this, pageId, pageStatusId, parent);
        }
    }

    getLanguagePageType(
        languageCode: string,
        pageType: string
    ): Page | undefined {
        const pageId: string | undefined = Object.keys(this.data.pages).find(
            (pageId: string) => {
                const page = this.data.pages[pageId];
                return page.type === pageType && page.language === languageCode;
            }
        );

        return pageId ? this.getSpecificPage(pageId) : undefined;
    }
}
