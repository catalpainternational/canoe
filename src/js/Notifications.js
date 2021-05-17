import { BACKEND_BASE_URL } from "js/urls";
import { getAuthenticationToken } from "js/AuthenticationUtilities";
import { getBrowser } from "ts/PlatformDetection";
import { urlBase64ToUint8Array } from "js/DjangoPushNotifications";
import { alertIfRequestWasMadeOffline } from "js/Errors";
import { logUnsubscribedFromNotifications } from "js/GoogleAnalytics";

const APPLICATION_SERVER_KEY = `${process.env.APPLICATION_SERVER_KEY}`;
const NOTIFICATION_ID_KEY = "notificationRegistrationId";

const storeRegistrationId = (registrationId) => {
    localStorage.setItem(NOTIFICATION_ID_KEY, registrationId);
};

const getStoredRegistrationId = () => {
    return localStorage.getItem(NOTIFICATION_ID_KEY);
};

const deleteStoredRegistrationId = () => {
    localStorage.removeItem(NOTIFICATION_ID_KEY);
};

const askPermission = () => {
    return new Promise((resolve, reject) => {
        const permissionResult = Notification.requestPermission((result) => {
            resolve(result);
        });

        if (permissionResult) {
            permissionResult.then(resolve, reject);
        }
    })
    .then((permissionResult) => {
        if (permissionResult !== 'granted') {
            throw new Error('We weren\'t granted permission.');
        }
    });
}

const fetchNotificationSubscription = async (registrationId) => {
    const token = getAuthenticationToken();
    const notificationsApiUrl = `${BACKEND_BASE_URL}/notifications/subscribe/${registrationId}/`;
    const fetchOptions = {
        mode: "cors",
        headers: {
            "Content-Type": "application/json",
            Authorization: `JWT ${token}`,
        },
    };
    const response = await fetch(notificationsApiUrl, fetchOptions);

    if (!response.ok) {
        throw new Error(response.status);
    }

    const subscriptionOnServer = await response.json();
    return subscriptionOnServer;
};

const postNotificationSubscription = async (subscriptionData) => {
    const token = getAuthenticationToken();

    const response = await fetch(`${BACKEND_BASE_URL}/notifications/subscribe/`, {
        mode: "cors",
        headers: {
            "Content-Type": "application/json",
            Authorization: `JWT ${token}`,
        },
        method: "POST",
        body: JSON.stringify(subscriptionData),
    });

    if (!response.ok) {
        throw new Error(response.status);
    }

    const postedSubscription = await response.json();
    return postedSubscription;
};

const pushManagerSubscribesToNotifications = async (registration) => {
    const subscribeOptions = {
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(APPLICATION_SERVER_KEY),
    };
    const notificationSubscription = await registration.pushManager.subscribe(subscribeOptions);
    return notificationSubscription;
};

const getApplicationID = () => {
    return BACKEND_BASE_URL.replace(new RegExp("http[s]?://"), "");
};

const formatSubscriptionForServer = (notificationSubscription) => {
    const endpointParts = notificationSubscription.endpoint.split("/");
    const registrationID = endpointParts.pop();
    const browser = getBrowser();

    const subscriptionPostJSON = {
        browser: browser.name.toUpperCase(),
        p256dh: btoa(
            String.fromCharCode.apply(
                null,
                new Uint8Array(notificationSubscription.getKey("p256dh"))
            )
        ),
        auth: btoa(
            String.fromCharCode.apply(null, new Uint8Array(notificationSubscription.getKey("auth")))
        ),
        name: `${browser.name} ${Math.floor(Math.random() * 1e9)}`,
        registration_id: registrationID,
        application_id: getApplicationID(),
    };

    return subscriptionPostJSON;
};

const turnOnNotifications = async (swRegistration) => {
    let notificationSubscription = null;
    try {
        // const permissionResult = await askPermission();
        notificationSubscription = await pushManagerSubscribesToNotifications(swRegistration);
    } catch (error) {
        alert(`notification error: ${error}`);
        if (error instanceof DOMException) {
            return null;
        }
    }
    alert(`notificationSubscription: ${notificationSubscription}`);

    const subscriptionPostJSON = formatSubscriptionForServer(notificationSubscription);
    return await postNotificationSubscription(subscriptionPostJSON);
};

const hasPermissionToNotify = () => {
    if (Notification.permission === "denied" || Notification.permission === "default") {
        return false;
    }
    return true;
};

export const supportsPushManager = async () => {
    const swRegistration = await navigator.serviceWorker.ready;
    return !!swRegistration.pushManager;
};

export const subscribeToNotifications = async () => {
    const swRegistration = await navigator.serviceWorker.ready;
    const subscription = await turnOnNotifications(swRegistration);
    if (!subscription) {
        return;
    }
    storeRegistrationId(subscription.registration_id);
};

export const unsubscribeFromNotifications = async () => {
    const swRegistration = await navigator.serviceWorker.ready;
    const subscription = await swRegistration.pushManager.getSubscription();

    if (subscription) {
        deleteStoredRegistrationId();
        subscription.unsubscribe();
    }

    logUnsubscribedFromNotifications();
};

export const isSubscribedToNotifications = async () => {
    if (!hasPermissionToNotify()) {
        return false;
    }

    const localRegistrationID = getStoredRegistrationId();
    if (localRegistrationID === null) {
        return false;
    }

    const swRegistration = await navigator.serviceWorker.ready;
    const pushSubscription = await swRegistration.pushManager.getSubscription();
    if (!pushSubscription) {
        return false;
    }

    let subscriptionOnServer = null;
    try {
        subscriptionOnServer = await fetchNotificationSubscription(localRegistrationID);
    } catch (error) {
        alertIfRequestWasMadeOffline(error);
        return false;
    }

    const serverRegistrationId = subscriptionOnServer.registration_id;
    if (serverRegistrationId && localRegistrationID !== serverRegistrationId) {
        storeRegistrationId(serverRegistrationId);
    }

    return true;
};

export const getNotifications = async () => {
    const swRegistration = await navigator.serviceWorker.ready;
    const notifications = await swRegistration.getNotifications();
    return notifications.reverse();
};
