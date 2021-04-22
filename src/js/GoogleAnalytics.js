import { getUserId } from "js/AuthenticationUtilities";

const isGoogleAnalyticsAvailable = () => {
    return !!process.env.GA_TAG;
};

const getDimensions = () => {
    const userId = getUserId();
    return {
        dimension1: userId,
    };
};

export const setGoogleAnalyticsGlobalDimensions = () => {
    if (!isGoogleAnalyticsAvailable()) {
        return;
    }
};

export const logPageView = (pageUrl) => {
    if (!isGoogleAnalyticsAvailable()) {
        return;
    }

    gtag("config", process.env.GA_TAG, {
        page_location: `${pageUrl}`,
        page_path: `/${pageUrl}`,
        ...getDimensions(),
    });
};

export const logNotificationReceived = (type) => {
    if (!isGoogleAnalyticsAvailable()) {
        return;
    }

    gtag("event", "Received", {
        event_category: "Notifications",
        event_label: `${type}`,
        ...getDimensions(),
    });
};

export const logUnsubscribedFromNotifications = () => {
    if (!isGoogleAnalyticsAvailable()) {
        return;
    }

    gtag("event", "Unsubscribed", {
        event_category: "Notifications",
        ...getDimensions(),
    });
};

export const logClickedPlayOnVideo = (videoUrl) => {
    if (!isGoogleAnalyticsAvailable()) {
        return;
    }

    gtag("event", "Clicked Play", {
        event_category: "Videos",
        event_label: videoUrl,
        ...getDimensions(),
    });
};