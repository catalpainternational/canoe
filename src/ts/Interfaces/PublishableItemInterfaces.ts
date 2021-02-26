import { TPublishableItem } from "ts/Types/PublishableItemTypes";
import { TManifest } from "ts/Types/ManifestTypes";
import { TPage, TWagtailPage } from "ts/Types/PageTypes";
import { TAssetEntry } from "ts/Types/AssetTypes";

export interface IPublishableItem extends TPublishableItem {
    /** The original request object (stripped of any authentication values) that works as the key into the cache for this item */
    requestObject: Request;
    /** Indicates whether the above requestObject had to have the authorization header stripped.
     * This is used to tell downstream processing whether the cache needs updating.
     */
    requestObjectCleaned: boolean;
    /** Indicates whether the above requestObject has had the authorization header stripped */
    requestObjectClean: boolean;

    /** Get the new response to use when updating this item in the cache */
    updatedResp: Response;
}

export interface IManifest extends TManifest, TPublishableItem {}

export interface IPage extends TPage, TPublishableItem {}

export interface IWagtailPage extends TWagtailPage, TPublishableItem {}

export interface IAssetEntry extends TAssetEntry, TPublishableItem {}