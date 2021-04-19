import { BACKEND_BASE_URL } from "js/urls";
import { unsubscribeFromNotifications } from "js/Notifications";
import { setAuthenticated, setUnauthenticated, getUser } from "ReduxImpl/Interface";

/** Post a login request to the server */
export const login = async (usernameAndPassword) => {
    const formData = new FormData();
    formData.append('username', usernameAndPassword.username);
    formData.append('password', usernameAndPassword.password);
    fetch(`${BACKEND_BASE_URL}/post_login`, {
        method: "POST",
        credentials: 'include',
        body: formData,
    })
    .then((response) => {
        if (!response.ok) throw new Error(`Login failed, HTTP status: ${response.status}`);
        return response.json();
    }).then(setAuthenticated);
};

/** Post a logout request to the server */
export const logout = () => {
    fetch(`${BACKEND_BASE_URL}/api_logout/`, {
        method: "POST",
        credentials: 'include',
    }).catch((err) => {
        // delete the Canoe=Offline-Session cookie
        // Django is configured to log users out if no Canoe-Offline-Session is received
        deleteCookie('Canoe-Offline-Session');
    })
    unsubscribeFromNotifications();
    setUnauthenticated();
    window.location.hash = "";
};

/** detect the login status */
export const initialiseIdentity = () => {
    const checkUrl = `${BACKEND_BASE_URL}/api_login/check`;
    fetch(checkUrl, {
        method: "GET",
        credentials: "include",
    }).then((response) => {
        if(response.status === 401) {
            // The server has firectly told us we are unauthenticated
            setUnauthenticated();
        } else if (response.ok) {
            // The server says we are authenticated, set the identity
            const responseClone = response.clone();
            response.json().then((userDetails) => {
                setAuthenticated(userDetails);
                caches.open('user-details').then((cache) => {
                    cache.put(checkUrl, responseClone);
                });
            });
        }
    }).catch((err) => {
        // we may be offline, check the cache for auth details
        caches.open('user-details').then((cache) => {
            cache.match(checkUrl).then((match) => {
                if (match !== undefined) {
                    match.json().then(setAuthenticated);
                }
            })
        })
    });
}

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
    const user = getUser();
    return user ? user.userId : null;
};

export const getUserGroups = () => {
    const user = getUser();
    return user ? user.groups : null;
};

const deleteCookie = (name) => {
    document.cookie = `${name}=; expires=0`;
};
