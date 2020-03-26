import { BACKEND_BASE_URL } from "js/urls";
import { dispatchLoggedOutEvent, dispatchSiteDownloadEvent } from "js/Events";

const USERNAME_STORAGE_KEY = "username";
const USER_ID_STORAGE_KEY = "userId";
const JWT_TOKEN_STORAGE_KEY = "token";
const USER_GROUPS_STORAGE_KEY = "userGroups";

const setCookie = (name, value) => {
    document.cookie = `${name}=${value};`;
};

const getCookie = name => {
    const cookieStrings = document.cookie.split(`; `);
    const cookieValue = cookieStrings.find(tokenString => {
        const [key] = tokenString.split("=");
        return key === name;
    });

    if (!cookieValue) {
        throw new Error(`Can't find "${cookieValue}" in cookie.`);
    }

    return cookieValue.split("=")[1];
};

const deleteCookie = name => {
    document.cookie = `${name}=; expired=${new Date(0)}`;
};

const fetchAuthToken = async usernameAndPassword => {
    const response = await fetch(`${BACKEND_BASE_URL}/token-auth/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(usernameAndPassword)
    });

    if (!response.ok) {
        throw new Error(response.status);
    }

    const responseJSON = await response.json();
    return responseJSON;
};

export const login = async usernameAndPassword => {
    let response = null;

    try {
        response = await fetchAuthToken(usernameAndPassword);
    } catch (error) {
        throw error;
    }

    const { token, username, userId, groups } = response;

    setCookie(JWT_TOKEN_STORAGE_KEY, token);
    localStorage.setItem(USERNAME_STORAGE_KEY, username);
    localStorage.setItem(USER_ID_STORAGE_KEY, userId);
    localStorage.setItem(USER_GROUPS_STORAGE_KEY, groups);

    dispatchSiteDownloadEvent();
};

export const logout = async () => {
    deleteCookie(JWT_TOKEN_STORAGE_KEY);
    localStorage.clear();
    dispatchLoggedOutEvent();
};

export const getAuthenticationToken = () => {
    return getCookie(JWT_TOKEN_STORAGE_KEY);
};

export const isUserLoggedIn = () => {
    try {
        return !!getAuthenticationToken();
    } catch (e) {
        return false;
    }
};

export const getUsername = () => {
    return localStorage.getItem(USERNAME_STORAGE_KEY);
};

export const getUserId = () => {
    return localStorage.getItem(USER_ID_STORAGE_KEY);
};

export const getUserGroups = () => {
    return localStorage.getItem(USER_GROUPS_STORAGE_KEY);
};
