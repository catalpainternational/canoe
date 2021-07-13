/* eslint-disable @typescript-eslint/no-unused-vars */
import Logger from "../Logger";
import { TManifestData } from "../Types/ManifestTypes";
import { TWagtailPage } from "../Types/PageTypes";
import { StorableItem } from "../Interfaces/StorableItem";

import {
    PublishableItem,
    UpdatePolicy,
} from "../Implementations/PublishableItem";
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
import {
    storeManifest,
    getManifestFromStore,
    getPreviewing,
} from "ReduxImpl/Interface";

const logger = new Logger("Manifest");

class ManifestError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ManifestError";
    }
}

export const ManifestBackendPath = "/manifest/v1";
export const ManifestCacheKey = "bero-manifest";

export class Manifest extends PublishableItem implements StorableItem {
    //#region Implement as Singleton
    static instance: Manifest;
    static pageInstances: Record<string, Page> = {};

    private constructor() {
        super();
        logger.log("Singleton created");
    }

    public static getInstance(): Manifest {
        if (!Manifest.instance) {
            Manifest.instance = new Manifest();
        }

        return Manifest.instance;
    }
    //#endregion

    get backendPath(): string {
        return ManifestBackendPath;
    }

    /** The cache in which the manifest is stored */
    get cacheKey(): string {
        return ManifestCacheKey;
    }

    /** The options to make a manifest request */
    get requestOptions(): RequestInit {
        const reqInit: any = {
            credentials: "include",
            cache: "default", // manifest can be returned from cache ( has conditional handling )
        };

        return reqInit as RequestInit;
    }

    // #region StorableItem implementations
    /** set the manifest data in the manifest store */
    saveToStore(data: TManifestData): void {
        storeManifest(data);
    }

    /** get the manifest data from the manifest store */
    get storedData(): TManifestData | undefined {
        return getManifestFromStore();
    }
    // #endregion StorableItem implementations

    async prepare(): Promise<void> {
        const response = await this.getResponse(
            getPreviewing() ? UpdatePolicy.ForceUpdate : UpdatePolicy.Default
        );
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
                throw new ManifestError("Manifest failed to deserialize");
            });
    }

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

    /** The updated response object
     * @deprecated
     */
    get updatedResp(): Response {
        return new Response();
    }

    /** Initialise this from the response
     * @deprecated
     */
    async initialiseFromResponse(resp: Response): Promise<boolean> {
        return Promise.resolve(false);
    }

    getPageManifestData(locationHash: string): Page | undefined {
        if (!this.storedData) {
            return undefined;
        }

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
        let pageInstance = Manifest.pageInstances[pageId];
        if (pageInstance) {
            // Check the current page object vs. what the manifest says
            const manifestVersion = this.storedData?.pages[pageId].version;
            if (pageInstance.version === manifestVersion) {
                return pageInstance;
            }

            // There has been a version change so delete and recreate below
            delete Manifest.pageInstances[pageId];
        }

        const pageType = this.storedData?.pages[pageId].type;

        switch (pageType) {
            case "homepage":
                pageInstance = new AllCourses(this, pageId, parent);
                break;
            case "coursepage":
                pageInstance = new Course(this, pageId, parent);
                break;
            case "lessonpage":
                pageInstance = new Lesson(this, pageId, parent);
                break;
            case "resourcesroot":
                pageInstance = new ResourcesRoot(this, pageId, parent);
                break;
            case "resourcearticle":
                pageInstance = new Resource(this, pageId, parent);
                break;
            case "learningactivitieshomepage":
                pageInstance = new TeachingRoot(this, pageId, parent);
                break;
            case "learningactivitytopicpage":
                pageInstance = new TeachingTopic(this, pageId, parent);
                break;
            case "learningactivitypage":
                pageInstance = new TeachingActivity(this, pageId, parent);
                break;
            default:
                pageInstance = new Page(this, pageId, parent);
                break;
        }

        Manifest.pageInstances[pageId] = pageInstance;

        return Manifest.pageInstances[pageId];
    }

    getLanguagePageType(
        languageCode: string,
        pageType: string
    ): Page | undefined {
        if (!this.storedData) {
            return undefined;
        }

        const pageId: string | undefined = Object.keys(
            this.storedData?.pages
        ).find((pageId: string) => {
            const page = this.storedData?.pages[pageId];
            if (!page) {
                return false;
            }
            return page.type === pageType && page.language === languageCode;
        });

        return pageId ? this.getSpecificPage(pageId) : undefined;
    }

    hasPageType(pageType: string): boolean {
        if (!this.storedData) {
            return false;
        }

        return Object.values(this.storedData?.pages)
            .map((p: TWagtailPage) => {
                return p.type;
            })
            .includes(pageType);
    }

    /** Description for log lines */
    toString(): string {
        return "Site Manifest";
    }
}
