/* eslint-disable @typescript-eslint/no-unused-vars */
import { TManifest, TPage } from "ts/Types/ManifestTypes";

import { storeManifestV1 } from "ts/Redux/Interface";

// See ts/Typings for the type definitions for these imports
import { store } from "ReduxImpl/Store";
import { getAuthenticationToken } from "js/AuthenticationUtilities";
import { ROUTES_FOR_REGISTRATION } from "js/urls";

export class Manifest implements TManifest {
    version: string;
    pages: Record<string, TPage>;

    /** This is a basic integrity check.  It ensures that:
     * - All child pages have matching page entries
     */
    get isValid(): boolean {
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
        if (this.version === "0.0.0") {
            return false;
        }

        return this.isValid;
    }

    get isPublishable(): boolean {
        if (this.version === "0.0.0") {
            return false;
        }

        return true;
    }

    constructor() {
        this.version = "0.0.0";
        this.pages = {
            "0": {
                loc_hash: "/site/manifest-loading",
                storage_container: "/site/manifest-loading",
                version: 3,
                api_url: "/api/v2/pages/0/",
                assets: [],
                language: "en",
                children: [],
                depth: 0,
                isValid: true,
                isAvailableOffline: false,
                isPublishable: false,
            },
        };

        if (!this.isPublishable) {
            this.getOrFetchManifest()
                .then((mani: any) => {
                    if (mani?.pages) {
                        this.version = mani.version;
                        this.pages = mani.pages;
                    }
                })
                .catch((_) => {
                    // Swallow the error, this will leave us with the default 'manifest'
                });
        }
    }

    getManifestFromStore(): any {
        return store.getState().manifestV1;
    }

    async fetchManifest(): Promise<any> {
        let responseFailure = "";
        try {
            const init = {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `JWT ${getAuthenticationToken()}`,
                },
            } as RequestInit;
            const resp = await fetch(
                `${ROUTES_FOR_REGISTRATION.manifest}/v1`,
                init
            );
            if (!resp.ok) {
                responseFailure = "Http error getting manifest";
            } else {
                return resp.json();
            }
        } catch {
            responseFailure = "Error getting manifest";
        }

        return Promise.reject(
            `Could not retrieve manifest. ${responseFailure}`
        );
    }

    private simpleManifestTest(manifest: any) {
        return manifest && Object.entries(manifest).length > 0;
    }

    async getOrFetchManifest(): Promise<any> {
        let manifestInStore = await this.getManifestFromStore();

        if (this.simpleManifestTest(manifestInStore)) {
            return manifestInStore;
        }
        try {
            manifestInStore = await this.fetchManifest();
            storeManifestV1(manifestInStore);
        } catch {
            // Did not successfully fetch manifest
            return Promise.reject(
                "Could not fetch the manifest and no manifest in the store"
            );
        }

        return manifestInStore;
    }

    async getLanguageCodes(): Promise<string[]> {
        const manifest = await this.getOrFetchManifest();
        const languageCodes = new Set(
            Object.values(manifest.pages).map((page: any) => {
                return page.languageCode as string;
            })
        );

        return [...languageCodes];
    }

    async getImages(): Promise<any[]> {
        const manifest = await this.getOrFetchManifest();
        const images = new Set(
            Object.values(manifest.pages)
                .filter((page: any) => {
                    return (
                        page.assets &&
                        page.assets.filter((asset: any) => {
                            return asset.type && asset.type === "image";
                        })
                    );
                })
                .map((page: any) => {
                    return page.assets.map((asset: any) => asset.renditions);
                })
        );

        return [...images];
    }

    async getRootPage(rootName = "home", languageCode = "en"): Promise<any> {
        const manifest = await this.getOrFetchManifest();
        const matchingPages = Object.values(manifest.pages).filter(
            (page: any) => {
                // Check there is a location hash and languages
                // - this is a sanity check only
                if (!page || !page.loc_hash || !page.language) {
                    return false;
                }

                // Check the location hash is for the nominal 'root' of what we're interested in
                const hashParts = (page.loc_hash as string)
                    .split("/")
                    .filter((part) => !!part);
                if (
                    hashParts.length > 2 ||
                    hashParts[hashParts.length - 1].indexOf(rootName) !== 0
                ) {
                    return false;
                }

                // Check the language matches
                if (languageCode === "tet" || languageCode === "tdt") {
                    // Check for both 'tet' and 'tdt' together
                    // We should be using 'tdt', but for historical reasons we usually use 'tet'
                    // so we're treating them the same
                    return page.language === "tet" || page.language === "tdt";
                }
                return (page.language as string).indexOf(languageCode) === 0;
            }
        );

        return matchingPages.length === 1
            ? (matchingPages[0] as any)
            : undefined;
    }

    async getPageId(locationHash: string): Promise<string> {
        const manifest = await this.getOrFetchManifest();
        const matchingPages = Object.entries(manifest.pages).filter(
            (pageElement: [string, unknown]) => {
                const page = pageElement[1] as any;
                // Check there is a location hash
                // - this is a sanity check only
                if (!page || !page.loc_hash) {
                    return false;
                }

                return (page.loc_hash as string).indexOf(locationHash) === 0;
            }
        );

        return matchingPages.length === 1 ? matchingPages[0][0] : "";
    }

    async getHomePageHash(languageCode: string): Promise<string> {
        const homePage = await this.getRootPage("home", languageCode);
        return homePage ? homePage.loc_hash : "";
    }

    getPageData(
        locationHash: string,
        languageCode: string
    ): Record<string, unknown> {
        throw new Error("Method not implemented.");
    }

    getPageDetail(locationHash: string, languageCode: string): TPage {
        throw new Error("Method not implemented.");
    }
}
