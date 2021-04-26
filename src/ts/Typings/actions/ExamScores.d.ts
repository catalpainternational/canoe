// js/actions/exam

/** Note that the module name here MUST match how it's used in the .ts files */
declare module "js/actions/ExamScores" {
    export function persistExamScore(
        pageId: number | string,
        scoreData: Record<string, any>
    ): Record<string, any>;
}
