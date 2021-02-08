/* eslint-disable @typescript-eslint/no-unused-vars */
import { TManifestData, TWagtailPage } from "ts/Types/ManifestTypes";
import { PublishableItem } from "ts/Implementations/PublishableItem";
import { Page } from "ts/Implementations/Page";
import AllCoursesPage from "ts/Implementations/Specific/AllCoursesPage";
import CoursePage from "ts/Implementations/Specific/CoursePage";
import LessonPage from "ts/Implementations/Specific/LessonPage";

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

export class Manifest extends PublishableItem<TManifestData> {
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    constructor(opts?: any) {
        super(opts);
    }

    get version(): string {
        return this.data?.version || "";
    }

    get pages(): Record<string, TWagtailPage> {
        return this.data?.pages || {};
    }

    get isInitialised(): boolean {
        return !!this.data?.pages;
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

    /** This is a basic integrity check.  It ensures that:
     * - All child pages have matching page entries
     */
    get isValid(): boolean {
        if (!super.isValid) {
            return false;
        }

        if (!this.isInitialised) {
            return false;
        }

        const allPageNames = new Set(Object.keys(this.pages));
        let childPageNames: Set<string> = new Set();
        allPageNames.forEach((pageName) => {
            childPageNames = new Set([
                ...childPageNames,
                ...this.pages[pageName].children.map((c) => c.toString()),
            ]);
        });
        const unMatchedChildren = new Set(
            [...childPageNames].filter((x) => !allPageNames.has(x))
        );

        return !unMatchedChildren.size;
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

        empty.version = "0.0.0";
        empty.pages = {};

        return empty;
    }

    GetDataFromStore(): void {
        const manifest = getManifestFromStore();
        if (manifest) {
            this.status = "ready";
            this.data = manifest;
        } else {
            this.status = "prepped";
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
            storeManifest(this.data);
            cacheUpdated = await this.updateCache();
        }
        setFetchingManifest(false);

        return cacheUpdated && this.isValid;
    }

    getPageManifestData(locationHash: string): Page | undefined {
        const pageId: string | undefined = Object.keys(this.data.pages).find(
            (pageId: string) => {
                const page = this.data.pages[parseInt(pageId)];
                return page.loc_hash === locationHash;
            }
        );
        if (pageId === undefined) {
            throw new ManifestError("location not found in manifest");
        }
        return this.getSpecificPage(parseInt(pageId));
    }

    getSpecificPage(pageId: number): Page {
        switch (this.data.pages[pageId].type) {
            case "homepage":
                return new AllCoursesPage(this, pageId);
            case "coursepage":
                return new CoursePage(this, pageId);
            case "lessonpage":
                return new LessonPage(this, pageId);
            default:
                return new Page(this, pageId);
        }
    }

    getLanguageHome(languageCode: string): Page | undefined {
        const homePageId: string | undefined = Object.keys(
            this.data.pages
        ).find((pageId: string) => {
            const page = this.data.pages[pageId];
            return page.type === "homepage" && page.language === languageCode;
        });

        return homePageId
            ? this.getSpecificPage(parseInt(homePageId))
            : undefined;
    }
}
