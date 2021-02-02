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
import {
    storeManifest,
    getManifestFromStore,
    setFetchingManifest,
} from "ReduxImpl/Interface";
import { getAuthenticationToken } from "js/AuthenticationUtilities";
import { ROUTES_FOR_REGISTRATION } from "js/urls";
import { Page } from "ts/Implementations/Page";
import AllCoursesPage from "./Specific/AllCoursesPage";
import CoursePage from "./Specific/CoursePage";
import LessonPage from "./Specific/LessonPage";

class ManifestError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ManifestError";
    }
}

export class Manifest implements TManifest {
    data!: TManifestData;

    constructor() {
        this.initialiseFromStore();
    }

    get version(): string {
        return this.data?.version || "";
    }

    get pages(): Record<string, TWagtailPage> {
        return this.data?.pages;
    }

    /** This is a basic integrity check.  It ensures that:
     * - All child pages have matching page entries
     */
    get isValid(): boolean {
        if (this.pages === undefined) {
            return false;
        }
        const allPageNames = new Set(Object.keys(this.pages));
        let childPageNames: Set<string> = new Set();
        allPageNames.forEach((pageName) => {
            childPageNames = new Set([
                ...childPageNames,
                ...this.pages[pageName].children.map((c) => c.toString()),
            ]);
        });
        const unMatchedChildren = new Set(
            [...childPageNames].filter((x) => !allPageNames.has(x))
        );

        return !unMatchedChildren.size;
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
        setFetchingManifest(true);
        try {
            const resp = await fetch(ROUTES_FOR_REGISTRATION.manifest, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "JWT " + getAuthenticationToken(),
                },
            });
            this.data = await resp.json();
        } finally {
            setFetchingManifest(false);
        }
        if (this.isValid) {
            storeManifest(this.data);
        }
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

    getPageManifestData(locationHash: string): Page | undefined {
        const pageId: string | undefined = Object.keys(this.data.pages).find(
            (pageId: string) => {
                const page = this.data.pages[parseInt(pageId)];
                return page.loc_hash === locationHash;
            }
        );
        if (pageId === undefined) {
            throw new ManifestError("location not found in manifest");
        }
        return this.getSpecificPage(parseInt(pageId));
    }

    getSpecificPage(pageId: number, parent?: Page): Page {
        switch (this.data.pages[pageId].type) {
            case "homepage":
                return new AllCoursesPage(this, pageId, parent);
            case "coursepage":
                return new CoursePage(this, pageId, parent);
            case "lessonpage":
                return new LessonPage(this, pageId, parent);
            default:
                return new Page(this, pageId);
        }
    }

    getLanguageHome(languageCode: string): Page | undefined {
        const homePageId: string | undefined = Object.keys(
            this.data.pages
        ).find((pageId: string) => {
            const page = this.data.pages[pageId];
            return page.type === "homepage" && page.language === languageCode;
        });
        return homePageId === undefined
            ? undefined
            : this.getSpecificPage(parseInt(homePageId));
    }

    findParent(pageId: number): Page | undefined {
        const parentId: string | undefined = Object.keys(this.data.pages).find(
            (id: string) => {
                const page = this.data.pages[parseInt(id)];
                return page.children.indexOf(pageId) !== -1;
            }
        );
        if (parentId === undefined) {
            return undefined;
            throw new ManifestError("parent not found in manifest");
        }
        return this.getSpecificPage(parseInt(parentId));
    }
}
