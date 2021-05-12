export default class Answer {
    /**
     * @param answer the answer to be checked ( an array of indices )
     * @param answerDefinitions the answer definitions
     * @returns  if the answer is correct
     */
    static isCorrect(answer: number[], answerDefinitions: any[]): boolean {
        const correct = answerDefinitions.every((a, i) => {
            const correctAndChosen = a.correct && answer.includes(i);
            const incorrectAndNotChosen = !a.correct && !answer.includes(i);
            return correctAndChosen || incorrectAndNotChosen;
        });
        return correct;
    }
}
