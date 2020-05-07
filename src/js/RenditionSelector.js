import { BACKEND_BASE_URL } from "js/urls";
import { getOrFetchManifest } from "js/WagtailPagesAPI";

const RENDITION_FILTER_SPEC_DEFAULT = 'width-800|format-webp';
const RENDITION_FILTER_SPEC_SAFARI = 'width-600|format-jpeg';


export class MissingImageError extends Error {
    constructor(message) {
        super(message);
        this.name = "MissingImageError";
    }
}

export const getImagePath = async (imageId) => {
    const manifest = await getOrFetchManifest();
    const images = manifest.images;
    const image = images[imageId];

    if (!image) {
        throw new MissingImageError(`Image with ID, ${imageId}, doesn't exist.`);
    }
    return _getRenditionUrl(image, true);
};

export function getImageUrls(images) {
    return Object.values(images).map((url) => _getRenditionUrl(url));
};

function _getRenditionUrl(renditions, includeDomain=false) {
    const filter_spec = navigator.userAgent.match(/Safari/g) ? RENDITION_FILTER_SPEC_SAFARI : RENDITION_FILTER_SPEC_DEFAULT;
    return `${includeDomain ? BACKEND_BASE_URL : ""}/media/${renditions[filter_spec]}`;
};
