// js/Errors

/** Note that the module name here MUST match how it's used in the .ts files */
declare module "js/Errors" {
    // How you declare an JS object that is newable
    export class MissingImageError extends Error {
        new(message: string): Error;
    }
}
