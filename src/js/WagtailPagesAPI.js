import { BACKEND_BASE_URL } from "js/urls";
import { token_authed_fetch, unauthed_fetch } from "js/Fetch";

/** Intended for use by Wagtail to generate previews */
export async function fetchPageNoAuth(path) {
    const pageMetadata = await unauthed_fetch(`${BACKEND_BASE_URL}${path}`);
    return pageMetadata;
}

export async function fetchPage(path) {
    const pageMetadata = await token_authed_fetch(`${BACKEND_BASE_URL}${path}`);
    return pageMetadata;
}
