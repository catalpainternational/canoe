// js/urls

/** Note that the module name here MUST match how it's used in the .ts files */
declare module "js/urls" {
    export const BACKEND_BASE_URL: string;
    export const CSRF_COOKIE_NAME: string;
    export const MEDIA_PATH: string;

    export const ROUTES_FOR_REGISTRATION: Record<string, string>;
}
