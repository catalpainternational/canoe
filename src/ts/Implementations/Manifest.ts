/* eslint-disable @typescript-eslint/no-unused-vars */
import { TManifestData } from "ts/Types/ManifestTypes";
import { TWagtailPage } from "ts/Types/PageTypes";

import { PublishableItem } from "ts/Implementations/PublishableItem";
import { Page } from "ts/Implementations/Page";

import AllCoursesPage from "ts/Implementations/Specific/AllCoursesPage";
import CoursePage from "ts/Implementations/Specific/CoursePage";
import LessonPage from "ts/Implementations/Specific/LessonPage";
import ResourcesRootPage from "ts/Implementations/Specific/ResourcesRootPage";
import ResourcePage from "ts/Implementations/Specific/ResourcePage";

// See ts/Typings for the type definitions for these imports
import { ROUTES_FOR_REGISTRATION } from "js/urls";
import {
    storeManifest,
    getManifestFromStore,
    setFetchingManifest,
} from "ReduxImpl/Interface";

class ManifestError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ManifestError";
    }
}

const apiUrl = "/manifest/v1";

export class Manifest extends PublishableItem<TManifestData> {
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    constructor(opts?: any) {
        super(opts, "", apiUrl);
    }

    get pages(): Record<string, TWagtailPage> {
        return this.data?.pages || {};
    }

    get isInitialised(): boolean {
        return !!this.data?.pages;
    }

    get api_url(): string {
        return apiUrl;
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

    set isValid(value: boolean) {
        if (!this.isInitialised) {
            super.isValid = false;
            return;
        }

        if (!value) {
            super.isValid = false;
            return;
        }

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

        super.isValid = !unMatchedChildren.size;
    }

    set isAvailableOffline(value: boolean) {
        super.isAvailableOffline = value && this.isValid;
    }

    set isPublishable(value: boolean) {
        super.isPublishable = value && this.isValid;
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

        empty.version = -1;
        empty.pages = {};

        return empty;
    }

    StoreDataToStore(): void {
        // And store the page data in Redux
        this.status.storeStatus = "unset";
        storeManifest(this.data);
        this.status.storeStatus = "ready";
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

    get updatedResp(): Response {
        return new Response(JSON.stringify(this.data));
    }

    get cacheKey(): string {
        return this.fullUrl;
    }

    async initialiseFromResponse(resp: Response): Promise<boolean> {
        setFetchingManifest(true);

        try {
            this.data = await resp.json();
        } catch {
            // Discard errors with getting json from response
        }

        let cacheUpdated = false;
        if (this.data && this.isValid) {
            this.StoreDataToStore();
            cacheUpdated = await this.updateCache();
        }
        setFetchingManifest(false);

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
        const pageStatusId = this.data.pages[pageId].api_url;

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
