import { reportError } from "ReduxImpl/Store";

const isAppOffline = error => {
    return error instanceof TypeError && error.message === "Failed to fetch";
};

export const alertIfRequestWasMadeOffline = error => {
    if (!isAppOffline(error)) {
        return false;
    }
    reportError(gettext("Sorry the network failed"));
    return true;
};

export const alertIfBrowserBlocksNotifications = error => {
    if (error instanceof DOMException && error.name === "NotAllowedError") {
        reportError(gettext("Your browser blocks notifications. Allow notifications in your browser settings."));
        return true;
    }
    return false;
};
