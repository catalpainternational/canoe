import { alertAppIsOffline } from "js/utilities";

const isAppOffline = error => {
    return error instanceof TypeError && error.message === "Failed to fetch";
};

export const alertIfRequestWasMadeOffline = error => {
    if (!isAppOffline(error)) {
        return false;
    }
    alertAppIsOffline();
    return true;
};

export const alertIfBrowserBlocksNotifications = error => {
    if (error instanceof DOMException && error.name === "NotAllowedError") {
        alert("Your browser blocks notifications. Allow notifications in your browser settings.");
        return true;
    }
    return false;
};
