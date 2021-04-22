export const BACKEND_BASE_URL = process.env.API_BASE_URL;
export const MEDIA_PATH = "/media";
export const APPELFLAP_PKI = `${BACKEND_BASE_URL}/appelflap_PKI`;

export const ROUTES_FOR_REGISTRATION = {
    media: `${BACKEND_BASE_URL}/media/media(_transcodes)?/.+`,
    images: `${BACKEND_BASE_URL}/media/images/.+`,
}
