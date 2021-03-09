import { BACKEND_BASE_URL } from "js/urls";
import { dispatchLoggedOutEvent, dispatchSiteDownloadEvent } from "js/Events";
import { unsubscribeFromNotifications } from "js/Notifications";
import { fetch_and_denote_unauthenticatedness as fetch } from "./Fetch";

const USERNAME_STORAGE_KEY = "username";
const USER_ID_STORAGE_KEY = "userId";
const JWT_TOKEN_STORAGE_KEY = "token";
const USER_GROUPS_STORAGE_KEY = "userGroups";
const EMPTY_SLATE_BOOT_KEY = "empty_slate_boot";
const USER_IS_AUTHED_STORAGE_KEY = "fetch_result_indicates_authed";

const setCookie = (name, value, keyOnlyAttributes = [], attributes = {}) => {
    // sets name=value cookie
    // sets keyOnlyAttributes provided eg ['secure', 'samesite']
    // sets value attributes provided eg {max-age: 3e8} to set expiry to 10 years in the future.
    // and potentially does vastly different things, because it does not escape inputs.
    document.cookie = Object.entries(attributes).reduce(
        (cookieString, keyValue) => `${cookieString};${keyValue[0]}=${keyValue[1]}`,
        keyOnlyAttributes.reduce(
            (cookieString, attribute) => `${cookieString};${attribute}`,
            `${name}=${value}`
        )
    );
};

const getCookie = (name) => {
    const found_cookie = document.cookie.split(`; `).find((tokenString) => {
        const [key] = tokenString.split("=");
        return key === name;
    });

    return found_cookie ? found_cookie.substring(found_cookie.indexOf('=') + 1) : null
};

const deleteCookie = (name) => {
    document.cookie = `${name}=; expired=${new Date(0)}`;
};

const fetchAuthToken = async (usernameAndPassword) => {
    return fetch(`${BACKEND_BASE_URL}/token-auth/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(usernameAndPassword),
    })
    .then((response) => {
        if (!response.ok) throw new Error(`Login failed, HTTP status: ${response.status}`);
        return response.json();
    })
};


export const login = async (usernameAndPassword) => {
    const { token, username, userId, groups } = await fetchAuthToken(usernameAndPassword);

    // Browsers refuse to set secure cookies from non https locations
    setCookie(
        JWT_TOKEN_STORAGE_KEY,
        token,
        window.location.protocol === "https:" ? ["secure"] : [],
        { "max-age": 3e8, samesite: "lax" }
    );
    localStorage.setItem(USERNAME_STORAGE_KEY, username);
    localStorage.setItem(USER_ID_STORAGE_KEY, userId);
    localStorage.setItem(USER_GROUPS_STORAGE_KEY, groups);
    setIsAuthed(true);
    sessionStorage.removeItem(EMPTY_SLATE_BOOT_KEY);
    dispatchSiteDownloadEvent();
};

export const logout = async () => {
    deleteCookie(JWT_TOKEN_STORAGE_KEY);
    localStorage.clear();
    unsubscribeFromNotifications();
    setIsAuthed(false);
    dispatchLoggedOutEvent();
};

export const getAuthenticationToken = () => {
    return getCookie(JWT_TOKEN_STORAGE_KEY);
};

export const isUserLoggedIn = () => {
    const auth_status_denoted = localStorage.getItem(USER_IS_AUTHED_STORAGE_KEY);
    return (auth_status_denoted === null || auth_status_denoted === "true");
};

export const userShouldLogin = () => {
    const is_deauthed = localStorage.getItem(USER_IS_AUTHED_STORAGE_KEY) === "false";
    const is_firstboot = sessionStorage.getItem(EMPTY_SLATE_BOOT_KEY) === "true";
    const is_user_logged_in = isUserLoggedIn();
    const skip_sw = process.env.SKIP_SW;
    return is_deauthed || is_firstboot && !skip_sw || !is_user_logged_in;
};

export const getUsername = () => {
    return localStorage.getItem(USERNAME_STORAGE_KEY) || process.env.GUEST_USERNAME;
};

export const getCapitalizedUsername = () => {
    const username = getUsername();
    return username[0].toUpperCase() + username.slice(1);
};

export const isGuestUser = () => {
    return process.env.GUEST_USERNAME === getUsername();
};

export const getUserId = () => {
    return localStorage.getItem(USER_ID_STORAGE_KEY);
};

export const getUserGroups = () => {
    return localStorage.getItem(USER_GROUPS_STORAGE_KEY);
};

export const setIsAuthed = (someBool) => {
    return localStorage.setItem(USER_IS_AUTHED_STORAGE_KEY, Boolean(someBool));
}
