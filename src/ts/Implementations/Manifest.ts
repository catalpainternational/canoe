/* eslint-disable @typescript-eslint/no-unused-vars */
import {
    TAssetEntry,
    TManifest,
    TManifestData,
    TPage,
    TWagtailPage,
    TWagtailPageData,
} from "ts/Types/ManifestTypes";

// See ts/Typings for the type definitions for these imports
import { storeManifest, getManifestFromStore } from "ReduxImpl/Interface";
import { getAuthenticationToken } from "js/AuthenticationUtilities";
import { ROUTES_FOR_REGISTRATION } from "js/urls";
import { Page } from "ts/Implementations/Page";

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

    /** This is a basic integrity check.  It ensures that:
     * - All child pages have matching page entries
     */
    get isValid(): boolean {
        if (this.pages === undefined) {
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
        return false;
    }

    get isPublishable(): boolean {
        return false;
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
        const resp = await fetch(`${ROUTES_FOR_REGISTRATION.manifest}/v1`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `JWT ${getAuthenticationToken()}`,
            },
        });
        this.data = await resp.json();
        storeManifest(this.data);
    }

    async getLanguageCodes(): Promise<string[]> {
        const languageCodes = new Set(
            Object.values(this.data.pages).map((page: any) => {
                return page.languageCode as string;
            })
        );

        return [...languageCodes];
    }

    async getImages(): Promise<any[]> {
        const images = new Set(
            Object.values(this.data.pages)
                .filter((page: TPage) => {
                    return (
                        page.assets &&
                        page.assets.filter((asset: TAssetEntry) => {
                            return asset.type && asset.type === "image";
                        })
                    );
                })
                .map((page: TPage) => {
                    return page.assets.map(
                        (asset: TAssetEntry) => asset.renditions
                    );
                })
        );

        return [...images];
    }

    getPageManifestData(
        locationHash: string,
        languageCode: string
    ): TWagtailPageData | undefined {
        const matchingPages = Object.values(this.data.pages).filter((page) => {
            // Check there is a location hash and languages
            // - this is a sanity check only
            if (!page || !page.loc_hash || !page.language) {
                return false;
            }

            // We could get false matches here, needs more work
            if (page.loc_hash.indexOf(locationHash) === -1) {
                return false;
            }

            // Check the language matches
            if (languageCode === "tet" || languageCode === "tdt") {
                // Check for both 'tet' and 'tdt' together
                // We should be using 'tdt', but for historical reasons we usually use 'tet'
                // so we're treating them the same
                return page.language === "tet" || page.language === "tdt";
            }
            return page.language.indexOf(languageCode) === 0;
        });

        return matchingPages.length === 1 ? matchingPages[0] : undefined;
    }

    async getPageById(pageId: string): Promise<TWagtailPage> {
        return await this.getPageByUrl(`/${pageId}/`);
    }

    async getPageByUrl(url: string): Promise<TWagtailPage> {
        const manifestPage = new Page(url);
        const pageFilled = await manifestPage.initialiseByRequest();
        if (pageFilled) {
            return manifestPage;
        }

        return Promise.reject(false);
    }

    async getPageData(
        locationHash: string,
        languageCode: string
    ): Promise<TWagtailPage> {
        const pageManifestData = this.getPageManifestData(
            locationHash,
            languageCode
        );

        if (pageManifestData) {
            return await this.getPageByUrl(pageManifestData.api_url);
        }

        return Promise.reject(false);
    }
}
