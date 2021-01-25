/* eslint-disable @typescript-eslint/no-unused-vars */
import { TManifest, TPage } from "ts/Types/ManifestTypes";

import { storeManifestV1 } from "ts/Redux/Interface";

// See ts/Typings for the type definitions for these imports
import { store } from "ReduxImpl/Store";
import { getAuthenticationToken } from "js/AuthenticationUtilities";
import { ROUTES_FOR_REGISTRATION } from "js/urls";
import { Page } from "ts/Implementations/Page";

export class Manifest implements TManifest {
    version!: string;
    pages!: Record<string, TPage>;

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

    static get emptyItem(): TManifest {
        return {
            version: "0.0.0",
            pages: { "0": Page.emptyItem },
            isValid: false,
            isAvailableOffline: false,
            isPublishable: false,
        };
    }

    constructor(opts?: Partial<Manifest>) {
        if (!opts) {
            opts = Manifest.emptyItem;
        }

        this.clone(opts);

        if (!this.isPublishable) {
            this.getOrFetch()
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

    /** Clone a supplied (partial) manifest into this */
    clone(opts?: Partial<Manifest>): void {
        if (opts?.version != null) {
            this.version = opts.version;
        }
        if (opts?.pages != null) {
            // Warning - this is a shallow copy only, it needs changing
            this.pages = opts.pages;
        }
    }

    getFromStore(): TManifest {
        return store.getState().manifestV1 as TManifest;
    }

    async fetchItem(): Promise<TManifest> {
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

    private simpleTest(manifest: any) {
        return manifest && (manifest as TManifest);
    }

    async getOrFetch(): Promise<TManifest> {
        let manifestInStore = this.getFromStore();

        if (this.simpleTest(manifestInStore)) {
            return manifestInStore;
        }
        try {
            manifestInStore = await this.fetchItem();
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
        const manifest = await this.getOrFetch();
        const languageCodes = new Set(
            (Object.values(manifest.pages) as TPage[]).map((page: TPage) => {
                return page.language;
            })
        );

        return [...languageCodes];
    }

    async getImages(): Promise<any[]> {
        const manifest = await this.getOrFetch();
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

    async getRootPageDefinition(
        rootName = "home",
        languageCode = "en"
    ): Promise<{ pageId: string; page: TPage }> {
        const manifest = await this.getOrFetch();
        const matchingPages = (Object.entries(manifest.pages) as [
            string,
            TPage
        ][]).filter((page: [string, TPage]) => {
            // Check there is a location hash and languages
            // - this is a sanity check only
            const pageDef = page[1];
            if (!page || !pageDef.loc_hash || !pageDef.language) {
                return false;
            }

            // Check the location hash is for the nominal 'root' of what we're interested in
            const hashParts = (pageDef.loc_hash as string)
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
                return pageDef.language === "tet" || pageDef.language === "tdt";
            }
            return (pageDef.language as string).indexOf(languageCode) === 0;
        });

        return matchingPages.length === 1
            ? { pageId: matchingPages[0][0], page: matchingPages[0][1] }
            : { pageId: "", page: Page.emptyItem };
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
