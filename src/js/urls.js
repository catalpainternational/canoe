export const BACKEND_BASE_URL = process.env.API_BASE_URL;
export const CSRF_COOKIE_NAME = process.env.CSRF_COOKIE_NAME;

export const ROUTES_FOR_REGISTRATION = {
    media: `${BACKEND_BASE_URL}/media/media(_transcodes)?/.+`,
    images: `${BACKEND_BASE_URL}/media/images/.+`,
}