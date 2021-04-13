// js/actions/Completion

/** Note that the module name here MUST match how it's used in the .ts files */
declare module "js/actions/Completion" {
    export function persistCompletion(
        pageId: string | number,
        extraDataObject: Record<string, any>
    ): void;
}
