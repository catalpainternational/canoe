// js/redux/Interface

/** Note that the module name here MUST match how it's used in the .ts files */
declare module "ReduxImpl/Interface" {
    import { TManifestData } from "ts/Types/ManifestTypes";
    import { TWagtailPageData } from "ts/Types/PageTypes";
    import { TPublishableItemStatus } from "ts/Types/PublishableItemTypes";

    export function storeManifest(manifest: TManifestData): void;
    export function getManifestFromStore(): TManifestData;
    export function setFetchingManifest(fetching: boolean): void;

    export function storePageData(
        pageId: any,
        pageData: TWagtailPageData
    ): void;
    export function getPageData(pageId: any): TWagtailPageData;

    export function storePublishableItemStatus(
        itemId: string,
        itemState: TPublishableItemStatus
    ): void;

    /** Get the publishable item's status
     * @returns the publishable item's status or null
     * @remarks test for null first, before casting the return `as TPublishableItemStatus`
     */
    export function getPublishableItemStatus(
        itemId: string
    ): TPublishableItemStatus | unknown;

    /** Get the status for all publishable items
     * @returns each publishable item's status as an array
     */
    export function getPublishableItemStatuses(): TPublishableItemStatus[];
}
