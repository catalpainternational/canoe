import { BACKEND_BASE_URL } from "js/urls";
import { unauthed_fetch } from "js/Fetch";

/** Intended for use by Wagtail to generate previews */
export async function fetchPageNoAuth(path) {
    const pageMetadata = await unauthed_fetch(`${BACKEND_BASE_URL}${path}`);
    return pageMetadata;
}
