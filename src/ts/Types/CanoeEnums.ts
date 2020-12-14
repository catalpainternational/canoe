/* eslint-disable @typescript-eslint/no-unused-vars */
/** Canoe needs to indicate various enumerations */

/** Whether Canoe has a 'lock' over itself (and its datastore),
 * or whether it is relinquishing that lock and can be restarted */
type TLock = "lock" | "unlock";

/** Whether a certain 'package' is (or should be) published or is (or should be) unpublished */
type TPublish = "publish" | "unpublish";

/** Whether a certain 'package' is (or should be) subscribed to or is (or should be) unsubscribed from */
type TSubscribe = "subscribe" | "unsubscribe";

/** Accepted Http methods (complete list) */
type THttpMethods = "GET" | "PUT" | "POST" | "DELETE";
