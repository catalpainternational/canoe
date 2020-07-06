import { alertAppIsOffline } from "js/utilities";

export class APIMissingPageError extends Error {
    constructor(message) {
        super(message);
        this.name = "MissingPageError";
    }
}

export class MissingImageError extends Error {
    constructor(message) {
        super(message);
        this.name = "MissingImageError";
    }
}

export class PageLacksTranslationDataError extends Error {
    constructor(message) {
        super(message);
        this.name = "PageLacksTranslationDataError";
    }
}

const isAppOffline = (error) => {
    return error instanceof TypeError && error.message === "Failed to fetch";
};

export const alertIfRequestWasMadeOffline = (error) => {
    if (!isAppOffline(error)) {
        return false;
    }
    alertAppIsOffline();
    return true;
};

export const alertIfBrowserBlocksNotifications = (error) => {
    if (error instanceof DOMException && error.name === "NotAllowedError") {
        alert("Your browser blocks notifications. Allow notifications in your browser settings.");
        return true;
    }
    return false;
};
