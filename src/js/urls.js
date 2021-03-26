export const BACKEND_BASE_URL = process.env.API_BASE_URL;
export const MEDIA_PATH = "/media";
export const APPELFLAP_PKI = `${BACKEND_BASE_URL}/appelflap_PKI`;

export const ROUTES_FOR_REGISTRATION = {
    media: `${BACKEND_BASE_URL}/media/media(_transcodes)?/.+`,
    images: `${BACKEND_BASE_URL}/media/images/.+`,
    pagesv2: `${BACKEND_BASE_URL}/api/v2/pages/.*`,
    manifest: `${BACKEND_BASE_URL}/manifest/v1`,
    tokenAuth: `${BACKEND_BASE_URL}/token-auth/`,
    pagePreviewv2: `${BACKEND_BASE_URL}/api/v2/page_preview`,
    actions: `${BACKEND_BASE_URL}/progress/actions`,
    subscribe: `${BACKEND_BASE_URL}/notifications/subscribe.*`,
    socketInfo: "/sockjs-node/info",
    appelflapPKIsign: `${APPELFLAP_PKI}/sign-cert`,
}
