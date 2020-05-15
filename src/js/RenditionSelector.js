import { BACKEND_BASE_URL } from "js/urls";
import { getOrFetchManifest } from "js/WagtailPagesAPI";
import { getPlatform } from "js/PlatformDetection";

const WEBP_RENDITION = "width-800|format-webp";
const JPEG_RENDITION = "width-600|format-jpeg";

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
    return getRenditionUrl(image);
};

export function getImageUrls(images) {
    return Object.values(images).map(getRenditionUrlWithoutDomain);
}

const getPlatformSpecificRendition = () => {
    const { browser } = getPlatform();
    let renditionType = "";
    if (browser.name === "Safari") {
        renditionType = JPEG_RENDITION;
    } else {
        renditionType = JPEG_RENDITION;
    }
    return renditionType;
};

const getRenditionUrlWithoutDomain = (renditions) => {
    const renditionType = getPlatformSpecificRendition();
    const renditionPath = renditions[renditionType];
    if (!renditionPath) {
        throw new MissingImageError(
            `${renditionType} image doesn't exist.
            Renditions: ${JSON.stringify(renditions)}`
        );
    }
    return `/media/${renditionPath}`;
};

function getRenditionUrl(renditions) {
    const renditionType = getPlatformSpecificRendition();
    const renditionPath = renditions[renditionType];
    if (!renditionPath) {
        throw new MissingImageError(
            `${renditionType} image doesn't exist.
            Renditions: ${JSON.stringify(renditions)}`
        );
    }
    return `${BACKEND_BASE_URL}/media/${renditionPath}`;
}
