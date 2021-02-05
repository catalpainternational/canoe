/* eslint-disable @typescript-eslint/no-unused-vars */
import {
    TManifestData,
    TWagtailPage,
    TWagtailPageData,
} from "ts/Types/ManifestTypes";
import { IManifest } from "ts/Interfaces/ManifestInterfaces";
import { TPageType } from "ts/Types/CanoeEnums";
import { PublishableItem } from "ts/Implementations/PublishableItem";
import { Page } from "ts/Implementations/Page";

// See ts/Typings for the type definitions for these imports
import { ROUTES_FOR_REGISTRATION } from "js/urls";
import {
    storeManifest,
    getManifestFromStore,
    setFetchingManifest,
} from "ReduxImpl/Interface";

export class Manifest extends PublishableItem<IManifest, TManifestData> {
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    constructor(opts?: any) {
        super(opts);

        this.status = "prepped";
        this.initialiseFromStore();
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

        const allPageNames = Object.keys(this.pages).sort() as string[];
        let childPageNames: Set<string> = new Set();
        allPageNames.forEach((pageName) => {
            childPageNames = new Set([
                ...childPageNames,
                ...this.pages[pageName].children.map((c) => c.toString()),
            ]);
        });
        const matchedPages = new Set([...allPageNames, ...childPageNames]);

        return matchedPages === childPageNames;
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

    get updatedResp(): Response {
        return new Response(JSON.stringify(this.data));
    }

    async accessCache(): Promise<boolean> {
        this.cache = await caches.open(this.fullUrl);

        return !!this.cache;
    }

    initialiseFromStore(): void {
        this.status = "loading";
        this.source = "store";

        this.data = getManifestFromStore();
        this.status = "ready";
    }

    async initialiseFromResponse(resp: Response): Promise<boolean> {
        setFetchingManifest(true);
        this.data = await resp.json();

        storeManifest(this.data);

        const cacheUpdated = await this.updateCache();
        setFetchingManifest(false);
        return cacheUpdated && !!this.data;
    }

    getPageManifestDataByLocationHash(
        locationHash: string
    ): TWagtailPageData | undefined {
        if (!this.isInitialised) {
            return undefined;
        }

        return Object.values(this.pages).find(
            (page) => page.loc_hash === locationHash
        );
    }

    getPageManifestDataByPageType(
        pageType: TPageType | string,
        languageCode = "en"
    ): TWagtailPageData | undefined {
        if (!this.isInitialised) {
            return undefined;
        }

        return Object.values(this.pages).find(
            (page) => page.type === pageType && page.language === languageCode
        );
    }

    getLanguageHome(languageCode: string): TWagtailPageData | undefined {
        return this.getPageManifestDataByPageType("homepage", languageCode);
    }

    async getPageByType(
        pageType: TPageType | string,
        languageCode = "en"
    ): Promise<TWagtailPage> {
        const pageManifestData = this.getPageManifestDataByPageType(
            pageType,
            languageCode
        );

        if (pageManifestData) {
            return await this.getPage(pageManifestData);
        }

        return Promise.reject(false);
    }

    async getPage(data: TWagtailPageData): Promise<TWagtailPage> {
        const manifestPage = new Page(data);
        const pageFilled = await manifestPage.initialiseFromCache();
        if (pageFilled) {
            return manifestPage;
        }
        const notInCache = ["prepped", "loading"].includes(manifestPage.status);
        if (notInCache) {
            if (await manifestPage.initialiseByRequest()) {
                return manifestPage;
            }
        }

        return Promise.reject(false);
    }

    async getPageData(locationHash: string): Promise<TWagtailPage> {
        const pageManifestData = this.getPageManifestDataByLocationHash(
            locationHash
        );

        if (pageManifestData) {
            return await this.getPage(pageManifestData);
        }

        return Promise.reject(false);
    }
}
