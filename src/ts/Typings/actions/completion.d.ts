// js/actions/completion

/** Note that the module name here MUST match how it's used in the .ts files */
declare module "js/actions/completion" {
    export function getLatestCompletionInCourse(
        courseSlug: string,
        lessonSlugs: string[]
    ): any;
    export function setComplete(
        courseSlug: string,
        lessonSlug: string,
        section: string
    ): void;
    export function isComplete(
        courseSlug: string,
        lessonSlug: string,
        module: string | undefined
    ): boolean;
}
