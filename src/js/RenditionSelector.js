import { BACKEND_BASE_URL } from "js/urls"
import { getManifestFromStore } from "ReduxImpl/Store"

const FILTER_SPEC = 'width-800|format-webp';

export function getImagePath(id) {
    const images = getManifestFromStore().images;
    return _getRenditionUrl(images[id]);
}

export function getImageUrls(images) {
    return Object.values(images).map(_getRenditionUrlWithoutDomain);
}

export const _getRenditionUrlWithoutDomain = (renditions) => {
    return `/media/${renditions[FILTER_SPEC]}`;
};

function _getRenditionUrl(renditions) {
    return `${BACKEND_BASE_URL}/media/${renditions[FILTER_SPEC]}`;
}
