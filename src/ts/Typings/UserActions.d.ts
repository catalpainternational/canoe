// js/UserActions

/** Note that the module name here MUST match how it's used in the .ts files */
declare module "js/UserActions" {
    export function persistFeedback(extraDataObject: Record<string, any>): void;
}
