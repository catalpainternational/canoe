// js/redux/Interface

/** Note that the module name here MUST match how it's used in the .ts files */
declare module "ReduxImpl/Interface" {
    import { TManifestData } from "ts/Types/ManifestTypes";
    import { TWagtailPageData } from "ts/Types/PageTypes";
    import { TItemStorageStatus } from "ts/Types/PublishableItemTypes";

    export function storeManifest(manifest: Record<string, any>): void;
    export function getManifestFromStore(): TManifestData;

    export function storePageData(
        pageId: any,
        pageData: Record<string, any>
    ): void;
    export function getPageData(pageId: any): TWagtailPageData;

    export function storeItemStorageStatus(
        itemId: string,
        itemState: TItemStorageStatus
    ): void;

    /** Get the publishable item's status
     * @returns the publishable item's status or null
     * @remarks test for null first, before casting the return `as TItemStorageStatus`
     */
    export function getItemStorageStatus(
        itemId: string
    ): TItemStorageStatus | unknown;

    /** Get the status for all publishable items
     * @returns each publishable item's status as an array
     */
    export function getItemStorageStatuses(): TItemStorageStatus[];
}
