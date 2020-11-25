import { getAuthenticationToken } from "js/AuthenticationUtilities.js";
import { APIMissingPageError } from "js/Errors";
import { getPlatform } from "js/PlatformDetection";

import { signalUserLoggedOut } from "ReduxImpl/Interface";

const WEBP_BROWSERS = ["Chrome", "Firefox"];
const DEAUTHED_HTTP_STATUSES = [401, 403];

export const fetch_and_denote_unauthenticatedness = (
    request_or_url,
    maybe_fetchopts
) => {
    return fetch(request_or_url, maybe_fetchopts).then((resp) => {
        if (DEAUTHED_HTTP_STATUSES.indexOf(resp.status) !== -1) {
            signalUserLoggedOut();
        }
        return resp;
    });
};

export const getImageRequest = (url) => {
    const token = getAuthenticationToken();
    const { browser } = getPlatform();
    return new Request(url, {
        mode: "cors",
        headers: {
            "Content-Type":
                browser.name in WEBP_BROWSERS ? "image/webp" : "image/jpeg",
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
    const response = await fetch_and_denote_unauthenticatedness(
        getPageRequest(url)
    );

    if (!response.ok) {
        throw new APIMissingPageError(
            `fetch("${url}") responded with a ${response.status}`
        );
    }

    const pagesResponseJSON = await response.json();

    if (pagesResponseJSON.items) {
        return pagesResponseJSON.items;
    }
    return pagesResponseJSON;
}
