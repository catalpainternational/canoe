/** If Appelflap is running, it is always on localhost
 * @remarks this MUST be 'localhost' not '127.0.0.1',
 * because geckoview translates '127.0.0.1' to 'localhost' in the background
 * which results in the route registration failing
 */
export const AF_LOCALHOSTURI = "http://localhost";

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
export const AF_CERTCHAIN = "certchain";

export const AF_CERTCHAIN_LENGTH_HEADER = "X-Appelflap-Chain-Length";

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
    setSubscriptions: {
        commandPath: `${AF_CACHE_API}/${AF_SUBSCRIPTIONS}`,
        method: "POST",
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

/** Get the port number that Appelflap is using
 * @remarks See: https://github.com/catalpainternational/appelflap/blob/7a4072f8b914748563333238bb1a49ea527480bd/docs/API/determining-endpoint.md for more info
 * @returns The port number that Appelflap is using, or -1 which means no Appelflap
*/
export function AppelflapPortNo() {
    const portwords = navigator.languages.filter((word) =>
        /^ep-[a-j]{4,5}$/.test(word)
    );

    if (portwords.length !== 1) {
        return -1;
    }

    const portNo = [...portwords[0].substr(3)]
        .map((el) => String.fromCharCode(el.charCodeAt(0) - 0x31))
        .join("");

    return parseInt(portNo, 10);
}

/** Builds each Appelflap API route individually. These will not result in false positives */
function initialiseSpecificRoutes() {
    // Port number range is 2^10 to 2^16-1 inclusive - 1024 to 65535
    const portRange = "(102[4-9]|10[3-9]\\d|1[1-9]\\d{2}|[2-9]\\d{3}|[1-5]\\d{4}|6[0-4]\\d{3}|65[0-4]\\d{2}|655[0-2]\\d|6553[0-5])";

    // Sort the commandPaths by longest first, probably not required, but ...
    return Object.keys(APPELFLAPCOMMANDS).sort((a, b) => {
        return b.commandPath.length - a.commandPath.length;
    }).map((commandName) => {
        const command = APPELFLAPCOMMANDS[commandName];
        return [`${AF_LOCALHOSTURI}:${portRange}/${command.commandPath}`, command.method];
    });
}

/** Builds a generic Appelflap API routes, this may result in false positives */
function genericRoutes() {
    // Port number range is '0000' to '99999' inclusive
    const portRange = "[0-9]{4,5}";
    return [[`${AF_LOCALHOSTURI}:${portRange}/${AF_API_PREFIX}/.*`, "GET"]];
}

/** Build the routes used to communicate with Appelflap so the service worker can register them as NetworkOnly
*/
export function buildAppelflapRoutes() {
    const portNo = AppelflapPortNo();
    return portNo > -1 ? genericRoutes() : [];
};
