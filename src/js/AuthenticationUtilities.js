import { BACKEND_BASE_URL, CSRF_COOKIE_NAME } from "js/urls";
import { unsubscribeFromNotifications } from "js/Notifications";
import { setAuthenticated, setUnauthenticated, getUser } from "ReduxImpl/Interface";
import Cookies from "js-cookie";

import { initialiseCertChain } from "ts/Appelflap/StartUp";
import Logger from "ts/Logger";

const logger = new Logger("AuthenticationUtilities");
const authUrl = `${BACKEND_BASE_URL}/auth`;
const cacheName = "user-details";

/** Delete the named cookie */
const deleteCookie = (name) => {
    document.cookie = `${name}=; expires=${new Date(0)}`;
};

/** Commit the user details response to the cache (the user is authenticated) */
const cacheUserDetailsResponse = async (response) => {
    const authResponse = response.clone();
    return await caches.open(cacheName).then((cache) => {
        return cache.put(authUrl, authResponse);
    });
};

/** Identify key functions that must be performed on changes of state */
const stateChangeActions = {
    onLoginSuccess: [
        setAuthenticated,
        initialiseCertChain,
    ],
    onLogoutError: [deleteCookie],
    onLogoutFinally: [
        unsubscribeFromNotifications,
        setUnauthenticated,
        initialiseCertChain,
    ],
    onUnauthenticated: [
        setUnauthenticated,
        initialiseCertChain,
    ],
    onIsAuthedResponse: [cacheUserDetailsResponse],
    onAuthenticated: [
        setAuthenticated,
        initialiseCertChain,
    ],
};

/**
 * Call the functions identified for a particular change of state
 * - Functions may be provided with a single value of `any` type
 * - Promise returning functions are NOT awaited
 * - Values returned by functions are discarded
 * - Exceptions thrown are passed up the stack
 **/
const performStateChange = (stateChange, data) => {
    if (!stateChangeActions[stateChange]) {
        logger.warn(`State change: ${stateChange} was not found`);
        return;
    }

    logger.info(`Performing state change: ${stateChange}`);

    stateChangeActions[stateChange].forEach((action) => { action(data); });
}

/** Post a login request to the server */
export const login = async (usernameAndPassword) => {
    const formData = new FormData();
    formData.append("username", usernameAndPassword.username);
    formData.append("password", usernameAndPassword.password);

    const requestInit = {
        method: "POST",
        credentials: "include",
        headers: { "X-CSRFToken": Cookies.get(CSRF_COOKIE_NAME) },
        body: formData,
    };

    return fetch(authUrl, requestInit).then((response) => {
        if (!response.ok) {
            throw new Error(`Login failed, HTTP status: ${response.status}`);
        }
        return response.json();
    }).then((userData) => { performStateChange("onLoginSuccess", userData); });
};

/** Post a logout request to the server */
export const logout = () => {
    const requestInit = {
        method: "DELETE",
        credentials: "include",
        headers: { "X-CSRFToken": Cookies.get(CSRF_COOKIE_NAME) },
    };

    return fetch(authUrl, requestInit).catch((err) => {
        // delete the Canoe=Offline-Session cookie
        // Django is configured to log users out if no Canoe-Offline-Session is received
        performStateChange("onLogoutError", "Canoe-Offline-Session");
    }).finally(() => { performStateChange("onLogoutFinally"); });
};

/** Detect the login status */
export const initialiseIdentity = async () => {
    const requestInit = {
        method: "GET",
        credentials: "include",
    };

    const { state, userDetails } = await fetch(authUrl, requestInit).then(async (response) => {
        let state = undefined;
        let userDetails = undefined;

        if(response.status === 401) {
            // The server has told us we are unauthenticated
            state = "onUnauthenticated";
        } else if (response.ok) {
            // The server says we are authenticated, save the response to the cache
            performStateChange("onIsAuthedResponse", response);

            state = "onAuthenticated";
            userDetails = await getUserDetailsFromResponse(response);
        }
        if (!!state) {
            throw new Error("unexpected auth response");
        }

        return { state, userDetails };
    }).catch(async (err) => {
        // we may be offline, check the cache for auth details
        const userDetails = await getUserDetailsFromCache();

        return {
            state: !!userDetails ? "onAuthenticated" : "onUnauthenticated",
            userDetails,
        };
    });

    performStateChange(state, userDetails);
    return !!userDetails;
}

export const getUsername = () => {
    const user = getUser();
    return user ? user.name : "Guest";
};

export const getCapitalizedUsername = () => {
    const username = getUsername();
    return username[0].toUpperCase() + username.slice(1);
};

export const getUserId = () => {
    const user = getUser();
    return user ? user.userId : null;
};

/** Get the user details from the authentication response (the user is authenticated) */
const getUserDetailsFromResponse = async (response) => {
    const authResponse = response.clone();
    return await authResponse.json();
};

/** Get the user details from the cached response */
const getUserDetailsFromCache = async () => {
    const cache = await caches.open(cacheName);
    const match = await cache.match(authUrl);
    if (match !== undefined) {
        return await match.json();
    }
    return undefined;
};

const getCookie = (name) => {
    const found_cookie = document.cookie.split(`; `).find((tokenString) => {
        const [key] = tokenString.split("=");
        return key === name;
    });

    return found_cookie ? found_cookie.substring(found_cookie.indexOf("=") + 1) : null
};
