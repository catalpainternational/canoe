// js/redux/Interface

/** Note that the module name here MUST match how it's used in the .ts files */
declare module "ReduxImpl/Interface" {
    import {
        TManifestData,
        TWagtailPageData,
    } from "src/ts/Types/ManifestTypes";

    export function storeManifest(manifest: TManifestData): void;
    export function getManifestFromStore(): TManifestData;
    export function storeWagtailPage(wagtailpage: TWagtailPageData): void;
    export function getWagtailPageFromStore(pageId: string): TWagtailPageData;
}
