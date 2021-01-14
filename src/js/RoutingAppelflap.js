/** If Appelflap is running, it is always on localhost
 * @remarks this MUST be 'localhost' not '127.0.0.1',
 * because geckoview translates '127.0.0.1' to 'localhost' in the background
 * which results in the route registration failing
 */
export const AF_LOCALHOSTURI = "http:/localhost";

export const AF_API_PREFIX = "appelflap";

export const AF_EIKEL_API = `${AF_API_PREFIX}/eikel`;
export const AF_META_API = `${AF_API_PREFIX}/eikel-meta`;
export const AF_CACHE_API = `${AF_API_PREFIX}/ingeblikt`;
export const AF_ACTION_API = `${AF_API_PREFIX}/do`;

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

/** Get the port number that Appelflap is using
 * @remarks See: https://github.com/catalpainternational/appelflap/blob/7a4072f8b914748563333238bb1a49ea527480bd/docs/API/determining-endpoint.md for more info
 * @returns The port number that Appelflap is using, or -1 which means no Appelflap
*/
export function AppelflapPortNo() {
    const portword = navigator.languages.filter((word) =>
        /^ep-[a-j]{4,5}$/.test(word)
    )[0];

    if (!portword) {
        return -1;
    }

    const portNo = [...portword.substr(3)]
        .map((el) => String.fromCharCode(el.charCodeAt(0) - 0x31))
        .join("");

    return parseInt(portNo, 10);
}

/** Registers each Appelflap API route individudally, will not result in false positives */
function initialiseSpecificRoutes(registerRoute, NetworkOnly) {
    const localHostURI = AF_LOCALHOSTURI.replaceAll(".","\.");
    // Port number range is 2^10 to 2^16-1 inclusive - 1024 to 65535
    const portRange = "(102[4-9]|10[3-9]\\d|1[1-9]\\d{2}|[2-9]\\d{3}|[1-5]\\d{4}|6[0-4]\\d{3}|65[0-4]\\d{2}|655[0-2]\\d|6553[0-5])";

    // Sort the commandPaths by longest first, probably not required, but ...
    Object.keys(APPELFLAPCOMMANDS).sort((a, b) => {
        return b.commandPath.length - a.commandPath.length;
    }).forEach((commandName) => {
        const command = APPELFLAPCOMMANDS[commandName];
        const route = `${localHostURI}:${portRange}/${command.commandPath}`.replaceAll("/", "\\/");
        registerRoute(RegExp(route), new NetworkOnly(), command.method);
    });
}

/** Does a generic registration for Appelflap API routes, this may result in false positives */
function genericRoutes(registerRoute, NetworkOnly) {
    const localHostURI = AF_LOCALHOSTURI.replaceAll(".","\.");
    // Port number range is '0000' to '99999' inclusive
    const portRange = "[0-9]{4,5}";
    const appelflapAPIs = [AF_META_API, AF_API_PREFIX];

    appelflapAPIs.forEach((api) => {
        const route = `${localHostURI}:${portRange}/${api}/.*`.replaceAll("/", "\\/");
        console.info(route);
        registerRoute(RegExp(route), new NetworkOnly());
    });
}

/** Register the routes used to communicate with Appelflap so the service worker handles them as NetworkOnly
 * @remarks registerRoute and NetworkOnly have to be passed in from sw.js or else the unit tests will not run
*/
export function initialiseAppelflapRoutes(registerRoute, NetworkOnly) {
    const portNo = AppelflapPortNo();

    if (portNo > -1) {
        genericRoutes(registerRoute, NetworkOnly);
    }
};
