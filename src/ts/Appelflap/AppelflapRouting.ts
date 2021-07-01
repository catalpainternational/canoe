/** If Appelflap is running, it is always on localhost
 * @remarks this MUST be 'localhost' not '127.0.0.1',
 * because geckoview translates '127.0.0.1' to 'localhost' in the background
 * which results in the route registration failing
 */
export const AF_LOCALHOSTURI = "http://localhost";

export const AF_API_PREFIX = "appelflap";

export const AF_ENDPOINT = `moz-extension://${AF_API_PREFIX}`;
export const AF_PROPERTIES = "serverinfo.json";

export const AF_EIKEL_API = `${AF_API_PREFIX}/eikel`;
export const AF_EIKEL_META_API = `${AF_API_PREFIX}/eikel-meta`;
export const AF_CACHE_API = `${AF_API_PREFIX}/ingeblikt`;
export const AF_ACTION_API = `${AF_API_PREFIX}/do`;

export const AF_DEBUG_API = `${AF_CACHE_API}/jeffreystube`;

export const AF_INS_LOCK = "insertion-lock";
export const AF_PUBLICATIONS = "publications";
export const AF_SUBSCRIPTIONS = "subscriptions";
export const AF_STATUS = "status";
export const AF_CERTCHAIN = "certchain";

export const AF_REBOOT_HARD = "hard-reboot";
export const AF_REBOOT_SOFT = "soft-reboot";
export const AF_LAUNCH_WIFIPICKER = "launch-wifipicker";
export const AF_LAUNCH_STORAGEMANAGER = "launch-storagemanager";

// export const AF_DEBUG_GECKOCACHE = "geckocache";
// export const AF_DEBUG_BUNDLES = "bundles";
// export const AF_DEBUG_GC = "garbagecollect";
export const AF_DEBUG_INJECTALL = "inject-all";

export const AF_CERTCHAIN_LENGTH_HEADER = "X-Appelflap-Chain-Length";

/** These are all of the commands provided by Appelflap across its API surface that we wish to expose */
export const APPELFLAPCOMMANDS = {
    //#region Applelflap administration
    getEndpointProperties: {
        commandPath: `${AF_ENDPOINT}/${AF_PROPERTIES}`,
        method: "GET",
    },
    //#endregion
    getLargeObjectIndexStatus: {
        commandPath: `${AF_EIKEL_META_API}/${AF_STATUS}`,
        method: "GET",
    },
    //#region Browser cache locking
    setLock: {
        commandPath: `${AF_CACHE_API}/${AF_INS_LOCK}`,
        method: "PUT",
    },
    releaseLock: {
        commandPath: `${AF_CACHE_API}/${AF_INS_LOCK}`,
        method: "DELETE",
    },
    //#endregion
    /** @deprecated No longer available from Appelflap, returns 404 */
    getCacheStatus: {
        commandPath: `${AF_CACHE_API}/${AF_STATUS}`,
        method: "GET",
    },
    //#region Appelflap Utilities for Browser and Android
    doRebootHard: {
        commandPath: `${AF_ACTION_API}/${AF_REBOOT_HARD}`,
        method: "POST",
    },
    doRebootSoft: {
        commandPath: `${AF_ACTION_API}/${AF_REBOOT_SOFT}`,
        method: "POST",
    },
    doLaunchWiFiPicker: {
        commandPath: `${AF_ACTION_API}/${AF_LAUNCH_WIFIPICKER}`,
        method: "POST",
    },
    doLaunchStorageManager: {
        commandPath: `${AF_ACTION_API}/${AF_LAUNCH_STORAGEMANAGER}`,
        method: "POST",
    },
    //#endregion
    //#region Publications
    getPublications: {
        commandPath: `${AF_CACHE_API}/${AF_PUBLICATIONS}`,
        method: "GET",
    },
    savePublication: {
        commandPath: `${AF_CACHE_API}/${AF_PUBLICATIONS}`,
        method: "PUT",
    },
    //#endregion
    //#region Subscriptions
    deletePublication: {
        commandPath: `${AF_CACHE_API}/${AF_PUBLICATIONS}`,
        method: "DELETE",
    },
    getSubscriptions: {
        commandPath: `${AF_CACHE_API}/${AF_SUBSCRIPTIONS}`,
        method: "GET",
    },
    setSubscriptions: {
        commandPath: `${AF_CACHE_API}/${AF_SUBSCRIPTIONS}`,
        method: "PUT",
    },
    //#endregion
    //#region Certificates
    getCertificate: {
        commandPath: `${AF_CACHE_API}/${AF_CERTCHAIN}`,
        method: "GET",
    },
    saveCertificate: {
        commandPath: `${AF_CACHE_API}/${AF_CERTCHAIN}`,
        method: "PUT",
    },
    deleteCertificate: {
        commandPath: `${AF_CACHE_API}/${AF_CERTCHAIN}`,
        method: "DELETE",
    },
    //#endregion
    //#region Appelflap debug
    // getCacheBundle: {
    //     commandPath: `${AF_DEBUG_API}/${AF_DEBUG_GECKOCACHE}`,
    //     method: "GET",
    // },
    // /** Set a bundle in(to) the browser cache */
    // setCacheBundle: {
    //     commandPath: `${AF_DEBUG_API}/${AF_DEBUG_GECKOCACHE}`,
    //     method: "POST",
    // },
    // /** Set up a bundle (outside the browser cache) */
    // setBundle: {
    //     commandPath: `${AF_DEBUG_API}/${AF_DEBUG_BUNDLES}`,
    //     method: "POST",
    // },
    // garbageCollection: {
    //     commandPath: `${AF_DEBUG_API}/${AF_DEBUG_GC}`,
    //     method: "POST",
    // },
    /** Inject All available bundles into the cache */
    setInjectAll: {
        commandPath: `${AF_DEBUG_API}/${AF_DEBUG_INJECTALL}`,
        method: "POST",
    },
    //#endregion
};
