import { BACKEND_BASE_URL, MEDIA_PATH } from "js/urls";
import { getBrowser } from "ts/PlatformDetection";
import { MissingImageError } from "js/Errors";

const WEBP_RENDITION = "width-800|format-webp";
const JPEG_RENDITION = "width-600|format-jpeg";

export function getImagePaths(images) {
    return Object.values(images).map((image) => getRenditionPath("image", image));
}

export const getRenditionUrl = (assetType, renditions) => {
    return `${BACKEND_BASE_URL}${getRenditionPath(assetType, renditions)}`;
};

export const getMediaUrl = (mediaPath) => {
    return `${BACKEND_BASE_URL}${MEDIA_PATH}/${mediaPath}`;
};

const getRenditionPath = (assetType, renditions) => {
    return `${MEDIA_PATH}/${getRendition(assetType, renditions)}`;
};

const getRendition = (assetType, renditions) => {
    const renditionType = getPlatformSpecificRendition(assetType);
    const rendition = renditions[renditionType];
    if (!rendition) {
        throw new MissingImageError(
            `${renditionType} image doesn't exist.
            Renditions: ${JSON.stringify(renditions)}`
        );
    }
    return rendition.path;
};

const getPlatformSpecificRendition = (assetType) => {
    const browser = getBrowser().name;
    switch (assetType) {
        case "image":
            return browser === "Safari" ? JPEG_RENDITION : WEBP_RENDITION;
        case "video":
            // Safari does support webm to a limited degree
            return browser === "Safari" ? MP4V_RENDITION : WEBM_RENDITION;
        case "audio":
            return browser === "Safari" ? OPUS_RENDITION : MP4A_RENDITION;
        default:
            // Default is for an 'image' and not on Safari
            return "WEBP_RENDITION";
    }
};
