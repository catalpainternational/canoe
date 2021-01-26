/* eslint-disable @typescript-eslint/no-unused-vars */
import { LoadingCallback } from "ts/Callbacks";
import { IManifest } from "ts/Interfaces/IManifest";
import { IPage } from "ts/Interfaces/IPage";
import { TPage } from "ts/Types/ManifestTypes";

// See ts/Typings for the type definitions for these imports
import { storeManifest, getManifestFromStore } from "ReduxImpl/Interface";
import { getAuthenticationToken } from "js/AuthenticationUtilities";
import { ROUTES_FOR_REGISTRATION } from "js/urls";

export class Manifest implements IManifest {
    data!: Record<string, any>;

    get version(): string {
        return this.data && this.data.version ? this.data.version : undefined;
    }

    get pages(): Record<string, TPage> {
        return this.data && this.data.pages ? this.data.pages : undefined;
    }

    constructor() {
        this.initialiseFromStore();
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

    async getPageId(locationHash: string): Promise<string> {
        const matchingPages = Object.entries(this.data.pages).filter(
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

    getPageData(
        locationHash: string,
        languageCode: string,
        loadingCallback: LoadingCallback
    ): Record<string, unknown> {
        throw new Error("Method not implemented.");
    }

    getPageDetail(locationHash: string, languageCode: string): IPage {
        throw new Error("Method not implemented.");
    }
}
