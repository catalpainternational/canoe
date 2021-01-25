/* eslint-disable @typescript-eslint/no-unused-vars */
import { TAssetEntry, TPage } from "ts/Types/ManifestTypes";

import { storePageV2 } from "ts/Redux/Interface";

// See ts/Typings for the type definitions for these imports
import { store } from "ReduxImpl/Store";
import { getAuthenticationToken } from "js/AuthenticationUtilities";
import { BACKEND_BASE_URL } from "js/urls";

export class Page implements TPage {
    loc_hash!: string;
    storage_container!: string;
    version!: number;
    api_url!: string;
    assets!: TAssetEntry[];
    language!: string;
    children!: number[];
    depth!: number;

    /** This will do a basic integrity check.
     * But for now it just checks that page details have actually been loaded, same as isPublishable
     */
    get isValid(): boolean {
        if (this.version === 0) {
            return false;
        }

        return true;
    }

    get isAvailableOffline(): boolean {
        if (this.version === 0) {
            return false;
        }

        return this.isValid;
    }

    get isPublishable(): boolean {
        if (this.version === 0) {
            return false;
        }

        return true;
    }

    static get emptyPage(): TPage {
        return {
            loc_hash: "",
            storage_container: "",
            version: 0,
            api_url: "",
            assets: [],
            language: "",
            children: [],
            depth: 0,
            isValid: false,
            isAvailableOffline: false,
            isPublishable: false,
        };
    }

    constructor(opts?: Partial<Page>) {
        if (!opts) {
            opts = Page.emptyPage;
        }

        this.clone(opts);

        if (!this.isPublishable) {
            this.getOrFetchPage()
                .then((page: any) => {
                    if (page) {
                        this.clone(page);
                    }
                })
                .catch((_) => {
                    // Swallow the error, this will leave us with the default 'page'
                });
        }
    }

    /** Clone a supplied (partial) page into this */
    clone(opts?: Partial<Page>): void {
        if (opts?.loc_hash != null) {
            this.loc_hash = opts.loc_hash;
        }
        if (opts?.storage_container != null) {
            this.storage_container = opts.storage_container;
        }
        if (opts?.version != null) {
            this.version = opts.version;
        }
        if (opts?.api_url != null) {
            this.api_url = opts.api_url;
        }
        if (opts?.assets != null) {
            // Warning - this is a shallow copy only, it needs changing
            this.assets = [...opts.assets];
        }
        if (opts?.language != null) {
            this.language = opts.language;
        }
        if (opts?.children != null) {
            // Warning - this is a shallow copy only, it needs changing
            this.children = [...opts.children];
        }
        if (opts?.depth != null) {
            this.depth = opts.depth;
        }
    }

    getPageFromStore(): any {
        return store.getState().pageV2;
    }

    async fetchPage(): Promise<any> {
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
                `${BACKEND_BASE_URL}${this.api_url}`,
                init
            );
            if (!resp.ok) {
                responseFailure = "Http error getting page";
            } else {
                return resp.json();
            }
        } catch {
            responseFailure = "Error getting page";
        }

        return Promise.reject(`Could not retrieve page. ${responseFailure}`);
    }

    private simplePageTest(page: any) {
        return page && Object.entries(page).length > 0;
    }

    async getOrFetchPage(): Promise<any> {
        let pageInStore = await this.getPageFromStore();

        if (this.simplePageTest(pageInStore)) {
            return pageInStore;
        }
        try {
            pageInStore = await this.fetchPage();
            storePageV2(pageInStore);
        } catch {
            // Did not successfully fetch page
            return Promise.reject(
                "Could not fetch the page and no page in the store"
            );
        }

        return pageInStore;
    }

    async getImages(): Promise<any[]> {
        const page = await this.getOrFetchPage();
        const images = new Set(
            page.assets.map((asset: any) => asset.renditions)
        );

        return [...images];
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
