// js/redux/Interface

/** Note that the module name here MUST match how it's used in the .ts files */
declare module "ReduxImpl/Interface" {
    import { TManifestData } from "src/ts/Types/ManifestTypes";
    import { TWagtailPageData } from "src/ts/Types/PageTypes";

    export function storeManifest(manifest: Record<string, any>): void;
    export function getManifestFromStore(): TManifestData;

    export function storePageData(
        pageId: any,
        pageData: Record<string, any>
    ): void;
    export function getPageData(pageId: any): TWagtailPageData;

    export function storePageComplete(
        pageId: string | number,
        date: Date,
        complete: boolean
    ): void;
    export function getStoredPageCompletionDate(
        pageId: string
    ): Date | undefined;
    export function storeExamScore(
        pageId: string | number,
        score: number
    ): void;
    export function getExamScore(pageId: string | number): number | undefined;

    export function getTestAnswer(
        examPageId: string | number,
        questionId: string | number
    ): any;
    export function getTestAnswers(examPageId: string | number): Array<any>;
    export function storeTestAnswer(
        examPageId: string | number,
        questionId: string | number,
        answer: any
    ): void;
    export function clearPageTestAnswers(pageId: string | number): void;

    export function storeAssessmentResults(
        pageId: string | number,
        resultData: Array<any>
    ): void;
}
