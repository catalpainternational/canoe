/* eslint-disable @typescript-eslint/no-unused-vars */
/** Canoe needs to indicate various enumerations */

/** Whether Canoe has a 'lock' over itself (and its datastore),
 * or whether it is relinquishing that lock and can be restarted */
export type TLock = "lock" | "unlock";

/** Whether a certain 'package' is (or should be) published or is (or should be) unpublished */
export type TPublish = "publish" | "unpublish";

/** Whether a certain 'package' is (or should be) subscribed to or is (or should be) unsubscribed from */
export type TSubscribe = "subscribe" | "unsubscribe";

/** Whether a request to Appelflap succeeded (returned 200), failed (returned 404 or 500), or was simply not relevant */
export type TAppelflapResult = "succeeded" | "not relevant" | "failed";

/** Accepted Http methods (complete list) */
export type THttpMethods = "GET" | "PUT" | "POST" | "DELETE";

/** The current state of a given publishable item in the cache */
export type TItemCacheStatus =
    | "unset"
    | "empty"
    | "prepared"
    | "loading"
    | "ready";

export type TItemStoreStatus = "unset" | "ready";

export type TPageType =
    | "homepage"
    | "coursepage"
    | "lessonpage"
    | "learningactivitieshomepage"
    | "learningactivitytopicpage"
    | "learningactivitypage"
    | "resourcesroot"
    | "resourcearticle";

export type TAssetType = "image" | "media";

export type TItemType = "manifest" | "page" | "asset";
