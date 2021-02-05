// js/actions/completion

/** Note that the module name here MUST match how it's used in the .ts files */
declare module "js/actions/completion" {
    export function getLatestCompletionInCourse(
        courseSlug: string,
        lessonSlugs: string[]
    ): any;
}
