import { BACKEND_BASE_URL } from "js/urls";
import { dispatchLoggedOutEvent, dispatchSiteDownloadEvent } from "js/Events";
import { unsubscribeFromNotifications } from "js/Notifications";

const USERNAME_STORAGE_KEY = "username";
const ANONYMOUS_USER = "😸";  // U+1f638 Grinning cat face with smiling eyes
const USER_ID_STORAGE_KEY = "userId";
const JWT_TOKEN_STORAGE_KEY = "token";
const USER_GROUPS_STORAGE_KEY = "userGroups";

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

    return found_cookie? found_cookie.substring(found_cookie.indexOf('=') + 1): null
};

const deleteCookie = (name) => {
    document.cookie = `${name}=; expired=${new Date(0)}`;
};

const fetchAuthToken = async (usernameAndPassword) => {
    const response = await fetch(`${BACKEND_BASE_URL}/token-auth/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(usernameAndPassword),
    });

    if (!response.ok) {
        throw new Error(response.status);
    }

    const responseJSON = await response.json();
    return responseJSON;
};

export const login = async (usernameAndPassword) => {
    let response = null;

    try {
        response = await fetchAuthToken(usernameAndPassword);
    } catch (error) {
        throw error;
    }

    const { token, username, userId, groups } = response;

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

    dispatchSiteDownloadEvent();
};

export const logout = async () => {
    deleteCookie(JWT_TOKEN_STORAGE_KEY);
    localStorage.clear();
    unsubscribeFromNotifications();
    dispatchLoggedOutEvent();
};

export const getAuthenticationToken = () => {
    return getCookie(JWT_TOKEN_STORAGE_KEY);
};

export const isUserLoggedIn = () => {
    return !!getAuthenticationToken();
};

export const getUsername = () => {
    return localStorage.getItem(USERNAME_STORAGE_KEY) || ANONYMOUS_USER;
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
