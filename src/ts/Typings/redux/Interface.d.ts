// js/redux/Interface

/** Note that the module name here MUST match how it's used in the .ts files */
declare module "ReduxImpl/Interface" {
    import { TManifestData, TWagtailPage } from "src/ts/Types/ManifestTypes";

    export function storeManifest(manifest: TManifestData): void;
    export function getManifestFromStore(): TManifestData;
    export function setFetchingManifest(fetching: boolean): void;
    export function storePageData(pageId: number, pageData: TWagtailPage): void;
    export function getPageData(pageId: number | undefined): TWagtailPage;
}
