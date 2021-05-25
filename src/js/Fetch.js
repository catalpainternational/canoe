import { getAuthenticationToken } from "js/AuthenticationUtilities";
import { APIMissingPageError } from "js/Errors";

/** Intended for use by Wagtail to generate previews - see WagtailPagesAPI.js */
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

/** Intended for use by Wagtail to generate previews - see WagtailPagesAPI.js */
export async function unauthed_fetch(url) {
    const response = await fetch_and_denote_unauthenticatedness(url);

    if (!response.ok) {
        throw new APIMissingPageError(`fetch("${url}") responded with a ${response.status}`);
    }

    const pagesResponseJSON = await response.json();

    if (pagesResponseJSON.items) {
        return pagesResponseJSON.items;
    }
    return pagesResponseJSON;
}