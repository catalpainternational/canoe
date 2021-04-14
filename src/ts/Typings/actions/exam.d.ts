// js/actions/exam

/** Note that the module name here MUST match how it's used in the .ts files */
declare module "js/actions/Exam" {
    export function persistExamScore(
        pageId: number | string,
        score: number,
        extraDataObject: Record<string, any>
    ): void;
    export function persistExamAnswer(
        pageId: number | string,
        questionId: number | string,
        answer: any,
        extraDataObject: Record<string, any>
    ): void;
}
