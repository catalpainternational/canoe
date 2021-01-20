// js/redux/Interface

/** Note that the module name here MUST match how it's used in the .ts files */
declare module "ReduxImpl/Store" {
    export const store: any; // This is actually redux Store
    export const LANGUAGE_STORAGE_KEY: string;
}
