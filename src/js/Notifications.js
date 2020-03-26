import { BACKEND_BASE_URL } from "js/urls";
import { getAuthenticationToken } from "js/AuthenticationUtilities";
import { getBrowserVersion, urlBase64ToUint8Array } from "js/DjangoPushNotifications";
import { isAppOffline, alertAppIsOffline } from "js/utilities";

const APPLICATION_SERVER_KEY = `${process.env.APPLICATION_SERVER_KEY}`;
const NOTIFICATION_ID_KEY = "notificationRegistrationId";

const storeRegistrationId = registrationId => {
    localStorage.setItem(NOTIFICATION_ID_KEY, registrationId);
};

const getStoredRegistrationId = () => {
    return localStorage.getItem(NOTIFICATION_ID_KEY);
};

const deleteStoredRegistrationId = () => {
    localStorage.removeItem(NOTIFICATION_ID_KEY);
};

const fetchNotificationSubscription = async registrationId => {
    const token = getAuthenticationToken();
    const notificationsApiUrl = `${BACKEND_BASE_URL}/notifications/subscribe/${registrationId}/`;
    const fetchOptions = {
        mode: "cors",
        headers: {
            "Content-Type": "application/json",
            Authorization: `JWT ${token}`
        }
    };
    const response = await fetch(notificationsApiUrl, fetchOptions);

    if (!response.ok) {
        throw new Error(response.status);
    }

    const subscriptionOnServer = await response.json();
    return subscriptionOnServer;
};

const postNotificationSubscription = async subscriptionData => {
    const token = getAuthenticationToken();

    const response = await fetch(`${BACKEND_BASE_URL}/notifications/subscribe/`, {
        mode: "cors",
        headers: {
            "Content-Type": "application/json",
            Authorization: `JWT ${token}`
        },
        method: "POST",
        body: JSON.stringify(subscriptionData)
    });

    if (!response.ok) {
        throw new Error(response.status);
    }

    const postedSubscription = await response.json();
    return postedSubscription;
};

const pushManagerSubscribesToNotifications = async registration => {
    const notificationSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(APPLICATION_SERVER_KEY)
    });
    return notificationSubscription;
};

const getApplicationID = () => {
    return BACKEND_BASE_URL.replace(new RegExp("http[s]?://"), "");
};

const formatSubscriptionForServer = notificationSubscription => {
    const endpointParts = notificationSubscription.endpoint.split("/");
    const registrationID = endpointParts.pop();
    const browser = getBrowserVersion(navigator.userAgent);

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
        application_id: getApplicationID()
    };

    return subscriptionPostJSON;
};

const turnOnNotifications = async swRegistration => {
    const notificationSubscription = await pushManagerSubscribesToNotifications(swRegistration);
    const subscriptionPostJSON = formatSubscriptionForServer(notificationSubscription);
    return await postNotificationSubscription(subscriptionPostJSON);
};

const hasPermissionToNotify = () => {
    if (Notification.permission === "denied" || Notification.permission === "default") {
        return false;
    }
    return true;
};

export const subscribe = async () => {
    const swRegistration = await navigator.serviceWorker.ready;
    const subscription = await turnOnNotifications(swRegistration);
    storeRegistrationId(subscription.registration_id);
};

export const unsubscribe = async () => {
    const swRegistration = await navigator.serviceWorker.ready;
    const subscription = await swRegistration.pushManager.getSubscription();

    if (subscription) {
        deleteStoredRegistrationId();
        subscription.unsubscribe();
    }
};

export const isSubscribedToNotifications = async () => {
    const localRegistrationID = getStoredRegistrationId();

    if (localRegistrationID === null || !hasPermissionToNotify()) {
        return false;
    }

    let subscriptionOnServer = null;
    try {
        subscriptionOnServer = await fetchNotificationSubscription(localRegistrationID);
    } catch (error) {
        if (isAppOffline(error)) {
            alertAppIsOffline();
        }
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
