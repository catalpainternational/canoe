/** If Appelflap is running, it is always on localhost */
export const AF_LOCALHOSTURI = "http://localhost";

export const AF_META_API = "meta";
export const AF_CACHE_API = "api/ingeblikt";
export const AF_ACTION_API = "api/do";

export const AF_INS_LOCK = "insertion-lock";
export const AF_PUBLICATIONS = "publications";
export const AF_SUBSCRIPTIONS = "subscriptions";
export const AF_STATUS = "status";
export const AF_REBOOT = "reboot";

/** These are all of the commands provided by Appelflap across its API surface */
export const APPELFLAPCOMMANDS = {
    getMetaStatus: {
        commandPath: `${AF_META_API}/${AF_STATUS}`,
        method: "GET",
    },
    setLock: {
        commandPath: `${AF_CACHE_API}/${AF_INS_LOCK}`,
        method: "PUT",
    },
    releaseLock: {
        commandPath: `${AF_CACHE_API}/${AF_INS_LOCK}`,
        method: "DELETE",
    },
    getCacheStatus: {
        commandPath: `${AF_CACHE_API}/${AF_STATUS}`,
        method: "GET",
    },
    doReboot: {
        commandPath: `${AF_ACTION_API}/${AF_REBOOT}`,
        method: "POST",
    },
    getPublications: {
        commandPath: `${AF_CACHE_API}/${AF_PUBLICATIONS}`,
        method: "GET",
    },
    savePublication: {
        commandPath: `${AF_CACHE_API}/${AF_PUBLICATIONS}`,
        method: "PUT",
    },
    deletePublication: {
        commandPath: `${AF_CACHE_API}/${AF_PUBLICATIONS}`,
        method: "DELETE",
    },
    getSubscriptions: {
        commandPath: `${AF_CACHE_API}/${AF_SUBSCRIPTIONS}`,
        method: "GET",
    },
    subscribe: {
        commandPath: `${AF_CACHE_API}/${AF_SUBSCRIPTIONS}`,
        method: "PUT",
    },
    unsubscribe: {
        commandPath: `${AF_CACHE_API}/${AF_SUBSCRIPTIONS}`,
        method: "DELETE",
    },
    bulkSubscribe: {
        commandPath: `${AF_CACHE_API}/${AF_SUBSCRIPTIONS}`,
        method: "POST",
    },
};

export let AppelflapPort = -1;

/** Get the port number that Appelflap is using or return -1 */
export function AppelflapPortNo() {
    // Appelflap knows the port number (which is randomly picked at launch); and it needs to let the web context know what the port number is.
    // It could be learned via a call to a contentscript (WebExtension), but that won't work in a ServiceWorker. Hence, we stuff it in the language
    // tags, which are available inside a ServiceWorker context.
    // This is not a security measure or anything — it's just that we can't use a statically defined port, because we simply don't know whether
    // it won't already be occupied. Similarly the charcode shifting is not obfuscation, it's just that Geckoview is picky about what we pass
    // as a language tag.

    if (AppelflapPort > -1) {
        return AppelflapPort;
    }

    const portword = navigator.languages.filter((word) =>
        /^ep-[a-j]{4,5}$/.test(word)
    )[0];

    if (!portword) {
        AppelflapPort = -1;
        return AppelflapPort;
    }

    const portNo = [...portword.substr(3)]
        .map((el) => String.fromCharCode(el.charCodeAt(0) - 0x31))
        .join("");

    AppelflapPort = parseInt(portNo, 10);

    return AppelflapPort;
}