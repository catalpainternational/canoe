// js/redux/Interface

/** Note that the module name here MUST match how it's used in the .ts files */
declare module "ReduxImpl/Interface" {
    import { TManifestData } from "ts/Types/ManifestTypes";
    import { TWagtailPageData } from "ts/Types/PageTypes";

    export function storeManifest(manifest: Record<string, any>): void;
    export function getManifestFromStore(): TManifestData;

    export function storePageData(
        pageId: any,
        pageData: Record<string, any>
    ): void;
    export function getPageData(pageId: any): TWagtailPageData;

    export function getStoredPageCompletionDate(
        pageId: string
    ): Date | undefined;
    export function getExamScores(pageId: string | number): Array<any>;

    export function getExamAnswer(
        examPageId: string | number,
        questionId: string | number
    ): any;
    export function getExamAnswers(examPageId: string | number): Array<any>;
    export function storeExamAnswer(
        examPageId: string | number,
        questionId: string | number,
        answer: any
    ): void;
}
