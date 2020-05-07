import { BACKEND_BASE_URL } from "js/urls"
import { getManifestFromStore } from "ReduxImpl/Store"

const FILTER_SPEC = 'width-800|format-webp';
const SAFARI_FILTER_SPEC = 'width-600|format-jpeg';

export function getImagePath(id) {
    const images = getManifestFromStore().images;
    return _getRenditionUrl(images[id], true);
}

export function getImageUrls(images) {
    return Object.values(images).map(_getRenditionUrl);
}

function _getRenditionUrl(renditions, includeDomain=false) {
    const filter_spec = navigator.userAgent.match(/Safari/g) ? SAFARI_FILTER_SPEC : FILTER_SPEC;
    return `${BACKEND_BASE_URL}/media/${renditions[filter_spec]}`;
}
