import { BACKEND_BASE_URL } from "js/urls";
import { unsubscribeFromNotifications } from "js/Notifications";
import { setAuthenticated, setUnauthenticated, getUser } from "ReduxImpl/Interface";

const USERNAME_STORAGE_KEY = "username";
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
    setAuthenticated({username, userId, groups});
};

export const logout = async () => {
    deleteCookie(JWT_TOKEN_STORAGE_KEY);
    localStorage.clear();
    unsubscribeFromNotifications();
    setUnauthenticated();
};

export const initialiseIdentity = () => {
    const token = getAuthenticationToken();
    if(token) {
        setAuthenticated({
            username: localStorage.getItem(USERNAME_STORAGE_KEY),
            userId: localStorage.getItem(USER_ID_STORAGE_KEY),
            groups: localStorage.getItem(USER_GROUPS_STORAGE_KEY),
        });
    }
}

export const getAuthenticationToken = () => {
    return getCookie(JWT_TOKEN_STORAGE_KEY);
};

export const getUsername = () => {
    const user = getUser();
    return user ? user.username : "Guest";
};

export const getCapitalizedUsername = () => {
    const username = getUsername();
    return username[0].toUpperCase() + username.slice(1);
};

export const isGuestUser = () => {
    return process.env.GUEST_USERNAME === getUsername();
};

export const getUserId = () => {
    return getUser().userId;
};

export const getUserGroups = () => {
    return getUser().groups;
};