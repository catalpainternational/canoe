// js/redux/Interface

/** Note that the module name here MUST match how it's used in the .ts files */
declare module "ReduxImpl/Interface" {
    export function storeManifest(manifestV2: any): void;
    export function getManifestFromStore(): any;
}
