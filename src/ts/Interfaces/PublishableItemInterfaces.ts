import { TPublishableItem } from "../Types/PublishableItemTypes";

export interface IPublishableItem extends TPublishableItem {
    /** The original request object (stripped of any authentication values) that works as the key into the cache for this item */
    requestObject: Request;
    /** Indicates whether the above requestObject had to have the authorization header stripped.
     * This is used to tell downstream processing whether the cache needs updating.
     */
    requestObjectCleaned: boolean;
    /** Indicates whether the above requestObject has had the authorization header stripped */
    requestObjectClean: boolean;

    /** The headers as returned with any previous response from the server, converted to a simple object */
    respHeaders: Record<string, string>;
    /** Get the new response to use when updating this item in the cache */
    updatedResp: Response;
}
