// js/Errors

/** Note that the module name here MUST match how it's used in the .ts files */
declare module "js/ExamGrader" {
    export default class ExamGrader {
        static saveExamAnswer(questionId: string, answer: string): void;
        static loadExamAnswer(questionId: string): any;
        static tallyFinalScore(examQuestions: any[]): any;
        static saveExamScore(
            courseSlug: string,
            finalScore: number,
            minimumScore: number
        ): any;
        static isExamFinished(courseSlug: string): boolean;
    }
}
