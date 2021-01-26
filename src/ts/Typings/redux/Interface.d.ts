// js/redux/Interface

/** Note that the module name here MUST match how it's used in the .ts files */
declare module "ReduxImpl/Interface" {
    export function storeManifest(manifest: Record<string, any>): void;
    export function getManifestFromStore(): Record<string, any>;
}
