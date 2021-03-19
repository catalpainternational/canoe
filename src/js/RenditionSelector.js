import { BACKEND_BASE_URL, MEDIA_PATH } from "js/urls";
import { getBrowser } from "ts/PlatformDetection";
import { MissingImageError } from "js/Errors";

const WEBP_RENDITION = "width-800|format-webp";
const JPEG_RENDITION = "width-600|format-jpeg";

export function getImagePaths(images) {
    return Object.values(images).map(getRenditionPath);
}

export const getRenditionUrl = (renditions) => {
    return `${BACKEND_BASE_URL}${getRenditionPath(renditions)}`;
};

export const getMediaUrl = (mediaPath) => {
    return `${BACKEND_BASE_URL}${MEDIA_PATH}/${mediaPath}`;
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
