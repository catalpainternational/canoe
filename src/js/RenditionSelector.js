import { BACKEND_BASE_URL, MEDIA_PATH } from "js/urls";
import { fetchManifest } from "js/WagtailPagesAPI";
import { getBrowser } from "ts/PlatformDetection";
import { MissingImageError } from "js/Errors";

const WEBP_RENDITION = "width-800|format-webp";
const JPEG_RENDITION = "width-600|format-jpeg";

export const getImageUrl = async (imageId) => {
    // This should be in a try catch block in case there's no manifest returned
    const manifest = await fetchManifest();
    const images = manifest.images;
    const image = images[imageId];

    if (!image) {
        throw new MissingImageError(`Image with ID, ${imageId}, doesn't exist.`);
    }
    return getRenditionUrl(image);
};

export function getImagePaths(images) {
    return Object.values(images).map(getRenditionPath);
}

const getRenditionUrl = (renditions) => {
    return `${BACKEND_BASE_URL}${getRenditionPath(renditions)}`;
};

const getRenditionPath = (renditions) => {
    return `${MEDIA_PATH}/${getRendition(renditions)}`;
};

const getRendition = (renditions) => {
    const renditionType = getPlatformSpecificRendition();
    const rendition = renditions[renditionType];
    if (!rendition) {
        throw new MissingImageError(
            `${renditionType} image doesn't exist.
            Renditions: ${JSON.stringify(renditions)}`
        );
    }
    return rendition;
};

const getPlatformSpecificRendition = () => {
    const browser = getBrowser();
    let renditionType = "";
    if (browser.name === "Safari") {
        renditionType = JPEG_RENDITION;
    } else {
        renditionType = WEBP_RENDITION;
    }
    return renditionType;
};
