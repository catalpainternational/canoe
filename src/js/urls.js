export const BACKEND_BASE_URL = process.env.API_BASE_URL;
export const APPELFLAP_PKI = `${BACKEND_BASE_URL}/appelflap_PKI`;

export const ROUTES_FOR_REGISTRATION = {
    media: `${BACKEND_BASE_URL}/media/media(_transcodes)?/.+`,
    images: `${BACKEND_BASE_URL}/media/images/.+`,
    tokenAuth: `${BACKEND_BASE_URL}/token-auth/`,
    socketInfo: "/sockjs-node/info",
    appelflapPKIsign: `${APPELFLAP_PKI}/sign-cert`,
}