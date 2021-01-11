// src/sw

/** Note that the module name here MUST match how it's used in the .ts files */
declare module "src/sw" {
    export function registerAppelflap(appelFlapURI: string): void;
}
