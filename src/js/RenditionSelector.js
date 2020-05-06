import { BACKEND_BASE_URL } from "js/urls";
import { getOrFetchManifest } from "js/WagtailPagesAPI";

const RENDITION_FORMAT = "width-800|format-webp";

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
    return _getRenditionUrl(image);
};

export function getImageUrls(images) {
    return Object.values(images).map(_getRenditionUrlWithoutDomain);
}

export const _getRenditionUrlWithoutDomain = (renditions) => {
    return `/media/${renditions[RENDITION_FORMAT]}`;
};

function _getRenditionUrl(renditions) {
    return `${BACKEND_BASE_URL}/media/${renditions[RENDITION_FORMAT]}`;
}
