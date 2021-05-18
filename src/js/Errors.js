import { setOffline } from "ReduxImpl/Interface";

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

export class URLDoesntExist extends Error {
    constructor(message) {
        super(message);
        this.name = "URLDoesntExist";
    }
}

export class ExamIsMissingAnAnswer extends Error {
    constructor(message) {
        super(message);
        this.name = "ExamIsMissingAnAnswer";
    }
}

const isAppOffline = (error) => {
    return error instanceof TypeError && error.message === "Failed to fetch";
};

export const alertIfRequestWasMadeOffline = (error) => {
    if (!isAppOffline(error)) {
        return false;
    }
    setOffline();
    return true;
};

export const alertIfBrowserBlocksNotifications = (error) => {
    if (error instanceof DOMException && error.name === "NotAllowedError") {
        alert("Your browser blocks notifications. Allow notifications in your browser settings.");
        return true;
    }
    return false;
};
