import { getAuthenticationToken } from "js/AuthenticationUtilities.js";
import { APIMissingPageError } from "js/Errors";

export const getRequest = (url) => {
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
    const response = await fetch(getRequest(url));

    if (!response.ok) {
        throw new APIMissingPageError(`fetch("${url}") responded with a ${response.status}`);
    }

    const pagesResponseJSON = await response.json();

    if (pagesResponseJSON.items) {
        return pagesResponseJSON.items;
    }
    return pagesResponseJSON;
}
