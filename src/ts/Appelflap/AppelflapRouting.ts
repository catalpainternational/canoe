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

export const AF_INS_LOCK = "insertion-lock";
export const AF_PUBLICATIONS = "publications";
export const AF_SUBSCRIPTIONS = "subscriptions";
export const AF_STATUS = "status";
export const AF_REBOOT = "reboot";
export const AF_CERTCHAIN = "certchain";

export const AF_CERTCHAIN_LENGTH_HEADER = "X-Appelflap-Chain-Length";

/** These are all of the commands provided by Appelflap across its API surface */
export const APPELFLAPCOMMANDS = {
    getEndpointProperties: {
        commandPath: `${AF_ENDPOINT}/${AF_PROPERTIES}`,
        method: "GET",
    },
    getLargeObjectIndexStatus: {
        commandPath: `${AF_EIKEL_META_API}/${AF_STATUS}`,
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
    setSubscriptions: {
        commandPath: `${AF_CACHE_API}/${AF_SUBSCRIPTIONS}`,
        method: "PUT",
    },
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
};
