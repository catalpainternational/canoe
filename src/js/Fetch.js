import { getAuthenticationToken, setIsAuthed } from "js/AuthenticationUtilities";
import { APIMissingPageError } from "js/Errors";
import { getBrowser } from "ts/PlatformDetection";


const WEBP_BROWSERS = ["Chrome", "Firefox"];

export const getImageRequest = (url) => {
    const token = getAuthenticationToken();
    const browser = getBrowser();
    return new Request(url, {
        mode: "cors",
        headers: {
            "Content-Type": browser.name in WEBP_BROWSERS ? "image/webp" : "image/jpeg",
            Authorization: `JWT ${token}`,
        },
    });
};

export const getPageRequest = (url) => {
    const token = getAuthenticationToken();
    return new Request(url, {
        mode: "cors",
        headers: {
            "Content-Type": "text/json",
            Authorization: `JWT ${token}`,
        },
    });
};

export async function token_authed_fetch(url) {
    const response = await fetch(getPageRequest(url));

    if (!response.ok) {
        throw new APIMissingPageError(`fetch("${url}") responded with a ${response.status}`);
    }

    const pagesResponseJSON = await response.json();

    if (pagesResponseJSON.items) {
        return pagesResponseJSON.items;
    }
    return pagesResponseJSON;
}
