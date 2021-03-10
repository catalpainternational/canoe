// js/actions/exam

/** Note that the module name here MUST match how it's used in the .ts files */
declare module "js/actions/exam" {
    export function hasUserTriedExam(courseSlug: string): boolean;
    export function getExamHighScore(courseSlug: string): number;
}
