import { BACKEND_BASE_URL } from "js/urls"
import { getManifestFromStore } from "ReduxImpl/Store"

const FILTER_SPEC = 'width-800|format-webp';

export function imagePath(id) {
    const images = getManifestFromStore().images;
    return renditionUrl(images[id]);
}

export function imageUrls(images) {
    return Object.values(images).map(renditionUrl);
}

function renditionUrl(renditions) {
    return `${BACKEND_BASE_URL}/media/${renditions[FILTER_SPEC]}`;
}
