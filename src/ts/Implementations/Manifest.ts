/* eslint-disable @typescript-eslint/no-unused-vars */
import Logger from "../Logger";
import { TManifestData } from "../Types/ManifestTypes";
import { TWagtailPage } from "../Types/PageTypes";
import { StorableItem } from "../Interfaces/StorableItem";

import { PublishableItem } from "./PublishableItem";
import { Page } from "./Page";

import AllCourses from "./Specific/AllCourses";
import Course from "./Specific/Course";
import Lesson from "./Specific/Lesson";
import ResourcesRoot from "./Specific/ResourcesRoot";
import Resource from "./Specific/Resource";
import TeachingRoot from "./Specific/TeachingRoot";
import TeachingTopic from "./Specific/TeachingTopic";
import TeachingActivity from "./Specific/TeachingActivity";

// See ts/Typings for the type definitions for these imports
import { BACKEND_BASE_URL, ROUTES_FOR_REGISTRATION } from "js/urls";
import { storeManifest, getManifestFromStore } from "ReduxImpl/Interface";

const logger = new Logger("Manifest");

class ManifestError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ManifestError";
    }
}

export const ManifestAPIURL = `${BACKEND_BASE_URL}/manifest/v1`;
export const ManifestCacheKey = "canoe-manifest";

export class Manifest extends PublishableItem implements StorableItem {
    /**
     * The api url of the manifest
     */
    get url(): string {
        return ManifestAPIURL;
    }
    /**
     * The cache in which the manifest is stored
     */
    get cacheKey(): string {
        return ManifestCacheKey;
    }

    /**
     * The options to make a manifest request
     */
    get requestOptions(): RequestInit {
        const reqInit: any = {
            credentials: "include",
            cache: "default", // manifest can be returned from cache ( has conditional handling )
        };

        return reqInit as RequestInit;
    }

    /** StorableItem implementations */
    /** set the manifest data in the manifest store */
    saveToStore(data: TManifestData): void {
        storeManifest(data);
    }
    /** get the manifest data from the manifest store */
    get storedData(): TManifestData | undefined {
        return getManifestFromStore();
    }
    /** end StorableItem implementations */

    async prepare(): Promise<void> {
        const response = await this.getResponse();
        return response
            .json()
            .then((manifestData: any) => {
                this.saveToStore(manifestData);
            })
            .catch((err) => {
                logger.warn(
                    err,
                    "...while deserializing json in cache response %s from the cache for %o",
                    response,
                    this
                );
                throw new ManifestError("Mainfest failed to deserialize");
            });
    }
    /** end StorableItem implementations */

    get data(): TManifestData | undefined {
        return this.storedData;
    }

    get pages(): Record<string, TWagtailPage> {
        return this.storedData?.pages || {};
    }

    get isInitialised(): boolean {
        return !!this.storedData;
    }

    get version(): number {
        return this.storedData?.version || -1;
    }

    get fullUrl(): string {
        return ROUTES_FOR_REGISTRATION.manifest;
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
     * - It has been initialised (it has a `data` value)
     * - All child pages have matching page entries
     */
    get isValid(): boolean {
        if (!this.isInitialised) {
            return false;
        }

        if (this.version === -1) {
            return false;
        }

        return this.childPagesValid;
    }

    async isAvailableOffline(): Promise<boolean> {
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

    GetDataFromStore(): void {
        // depecated
        return;
    }

    StoreDataToStore(): void {
        // depecated
        return;
    }
    get updatedResp(): Response {
        //deprecated
        return new Response();
    }
    async initialiseFromResponse(resp: Response): Promise<boolean> {
        //deprecated
        return Promise.resolve(false);
    }

    getPageManifestData(locationHash: string): Page | undefined {
        if (!this.storedData) return undefined;
        const pageId: string | undefined = Object.keys(
            this.storedData.pages
        ).find((pageId: string) => {
            const page = this.storedData?.pages[pageId];
            return page && page.loc_hash === locationHash;
        });
        if (pageId === undefined) {
            throw new ManifestError(
                `Location ${locationHash} not found in manifest`
            );
        }
        return this.getSpecificPage(pageId);
    }

    getSpecificPage(pageId: string, parent?: Page): Page {
        const pageType = this.storedData?.pages[pageId].type;

        switch (pageType) {
            case "homepage":
                return new AllCourses(this, pageId, parent);
            case "coursepage":
                return new Course(this, pageId, parent);
            case "lessonpage":
                return new Lesson(this, pageId, parent);
            case "resourcesroot":
                return new ResourcesRoot(this, pageId, parent);
            case "resourcearticle":
                return new Resource(this, pageId, parent);
            case "learningactivitieshomepage":
                return new TeachingRoot(this, pageId, parent);
            case "learningactivitytopicpage":
                return new TeachingTopic(this, pageId, parent);
            case "learningactivitypage":
                return new TeachingActivity(this, pageId, parent);
            default:
                return new Page(this, pageId, parent);
        }
    }

    getLanguagePageType(
        languageCode: string,
        pageType: string
    ): Page | undefined {
        if (!this.storedData) return undefined;
        const pageId: string | undefined = Object.keys(
            this.storedData?.pages
        ).find((pageId: string) => {
            const page = this.storedData?.pages[pageId];
            if (!page) return false;
            return page.type === pageType && page.language === languageCode;
        });

        return pageId ? this.getSpecificPage(pageId) : undefined;
    }

    hasPageType(pageType: string): boolean {
        if (!this.storedData) return false;
        return Object.values(this.storedData?.pages)
            .map((p: TWagtailPage) => {
                return p.type;
            })
            .includes(pageType);
    }
    get str(): string {
        return "Site Manifest";
    }
}
