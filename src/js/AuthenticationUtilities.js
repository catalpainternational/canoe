import { BACKEND_BASE_URL } from "js/urls";
import { unsubscribeFromNotifications } from "js/Notifications";
import { setAuthenticated, setUnauthenticated, getUser } from "ReduxImpl/Interface";
import Cookies from "js-cookie";

const authUrl = `${BACKEND_BASE_URL}/auth`;
/** Post a login request to the server */
export const login = async (usernameAndPassword) => {
    const formData = new FormData();
    formData.append('username', usernameAndPassword.username);
    formData.append('password', usernameAndPassword.password);
    return fetch(authUrl, {
        method: "POST",
        credentials: 'include',
        body: formData,
        headers: {
            "X-CSRFToken": Cookies.get("csrftoken"),
        },
    })
    .then((response) => {
        if (!response.ok) throw new Error(`Login failed, HTTP status: ${response.status}`);
        return response.json();
    }).then(setAuthenticated);
};

/** Post a logout request to the server */
export const logout = () => {
    return fetch(authUrl, {
        method: "DELETE",
        credentials: 'include',
        headers: {
            "X-CSRFToken": Cookies.get("csrftoken"),
        },
    }).catch((err) => {
        // delete the Canoe=Offline-Session cookie
        // Django is configured to log users out if no Canoe-Offline-Session is received
        deleteCookie('Canoe-Offline-Session');
    }).finally(() => {
        unsubscribeFromNotifications();
        setUnauthenticated();
    });
};

/** detect the login status */
export const initialiseIdentity = async () => {
    return fetch(authUrl, {
        method: "GET",
        credentials: "include",
    }).then(async (response) => {
        if(response.status === 401) {
            // The server has told us we are unauthenticated
            return setUnauthenticated();
        } else if (response.ok) {
            // The server says we are authenticated, set the identity
            const responseClone = response.clone();
            const userDetails = await response.json();
            caches.open('user-details').then((cache) => {
                cache.put(authUrl, responseClone);
            });
            return setAuthenticated(userDetails);
        } else {
            throw new Error('unexpected auth response');
        }
    }).catch(async (err) => {
        // we may be offline, check the cache for auth details
        const cache = await caches.open('user-details');
        const match = await cache.match(authUrl);
        if (match !== undefined) {
            const userDetails = await match.json();
            // The cache says we are authenticated, set the identity
            return setAuthenticated(userDetails);
        }
        else {
            // The cache has told us we are unauthenticated
            return setUnauthenticated();
        }
    });
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

const getCookie = (name) => {
    const found_cookie = document.cookie.split(`; `).find((tokenString) => {
        const [key] = tokenString.split("=");
        return key === name;
    });

    return found_cookie ? found_cookie.substring(found_cookie.indexOf('=') + 1) : null
};

const deleteCookie = (name) => {
    document.cookie = `${name}=; expires=${new Date(0)}`;
};
