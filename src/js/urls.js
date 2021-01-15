export const BACKEND_BASE_URL = `${process.env.API_BASE_URL}`;
export const MANIFEST_BACKEND_BASE_URL = `${process.env.NEW_MANIFEST_API_BASE_URL}`;
export const MANIFEST_URL = `${MANIFEST_BACKEND_BASE_URL}/manifest/0.0.1`;
export const WAGTAIL_MANIFEST_URL = `${BACKEND_BASE_URL}/manifest`;
export const MEDIA_PATH = "/media";

export const ROUTES_FOR_REGISTRATION = {
    media: `${BACKEND_BASE_URL}/media/media/.+`,
    images: `${BACKEND_BASE_URL}/media/images/.+`,
    pagesv2: `${BACKEND_BASE_URL}/api/v2/pages/.*`,
    manifestv2: `${MANIFEST_BACKEND_BASE_URL}/manifest/0\.0\.1`,
    manifest: `${BACKEND_BASE_URL}/manifest`,
    tokenAuth: `${BACKEND_BASE_URL}/token-auth/`,
    pagePreviewv2: `${BACKEND_BASE_URL}/api/v2/page_preview`,
    actions: `${BACKEND_BASE_URL}/progress/actions`,
    subscribe: `${BACKEND_BASE_URL}/notifications/subscribe.*`,
    socketInfo: "/sockjs-node/info",
}
