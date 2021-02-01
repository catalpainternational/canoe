/* eslint-disable @typescript-eslint/no-unused-vars */
import {
    TAssetEntry,
    TManifest,
    TManifestData,
    TPage,
    TWagtailPage,
    TWagtailPageData,
} from "ts/Types/ManifestTypes";
import { TPageType } from "ts/Types/CanoeEnums";
import { Page } from "ts/Implementations/Page";

// See ts/Typings for the type definitions for these imports
import {
    storeManifest,
    getManifestFromStore,
    setFetchingManifest,
} from "ReduxImpl/Interface";
import { getAuthenticationToken } from "js/AuthenticationUtilities";
import { ROUTES_FOR_REGISTRATION } from "js/urls";

export class Manifest implements TManifest {
    data!: TManifestData;

    constructor() {
        this.initialiseFromStore();
    }

    get version(): string {
        return this.data?.version || "";
    }

    get pages(): Record<string, TWagtailPage> {
        return this.data?.pages || { "0": Page.emptyItem };
    }

    get isInitialised(): boolean {
        return !!this.data?.pages;
    }

    /** This is a basic integrity check.  It ensures that:
     * - All child pages have matching page entries
     */
    get isValid(): boolean {
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

    static get emptyItem(): TManifest {
        return {
            version: "0.0.0",
            pages: { "0": Page.emptyItem },
            isValid: false,
            isAvailableOffline: false,
            isPublishable: false,
        };
    }

    initialiseFromStore(): void {
        this.data = getManifestFromStore();
    }

    async initialiseByRequest(): Promise<void> {
        setFetchingManifest(true);
        try {
            const resp = await fetch(`${ROUTES_FOR_REGISTRATION.manifest}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `JWT ${getAuthenticationToken()}`,
                },
            });
            this.data = await resp.json();
        } finally {
            setFetchingManifest(false);
        }
        storeManifest(this.data);
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
        const pageFilled = await manifestPage.initialiseByRequest();
        if (pageFilled) {
            return manifestPage;
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
