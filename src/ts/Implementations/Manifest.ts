/* eslint-disable @typescript-eslint/no-unused-vars */
import { TManifest } from "ts/Types/ManifestTypes";
import { TPage } from "ts/Types/ManifestTypes";

import { storeManifestV2 } from "ts/Redux/Interface";

// See ts/Typings for the type definitions for these imports
import { store } from "ReduxImpl/Store";
import { getAuthenticationToken } from "js/AuthenticationUtilities";
import { MANIFEST_URL } from "js/urls";
import { buildFakeManifest } from "../tests/fakeManifest";

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
        return store.getState().manifestv2;
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
            const resp = await fetch(MANIFEST_URL, init);
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
            storeManifestV2(manifestInStore);
        } catch {
            // Did not successfully fetch manifest
            return Promise.reject(
                "Could not fetch the manifest and no manifest in the store"
            );
        }

        return manifestInStore;
    }
}
