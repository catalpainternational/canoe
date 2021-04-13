/* Exam results module
 * The access point for interface components to set and query exam scores
 * All interface methods should be synchronous.
 * Depends on the action_store module to persist information
 */

import { 
    storeExamAnswer, storeExamScore, 
    clearExamStore, bumpExamStoreVersion 
} from "js/redux/Interface";
import { 
    saveAndPostAction, readActions,
    EXAM_ANSWER_TYPE, EXAM_FINAL_SCORE_TYPE,
} from "./actions_store";
import Logger from "../../ts/Logger";

const logger = new Logger("Exam Scores");

/** Clear the in memory store of exam scores - for use on logout */
export const clearStateExamData = () => {
    clearExamStore();
};

/** read exam scores from store and update redux state */
export async function readExamDataIntoState() {
    let scores, answers;
    try {
        scores = await readActions(EXAM_FINAL_SCORE_TYPE);
        answers = await readActions(EXAM_ANSWER_TYPE);
    } catch (e) {
        logger.warn("Error in reading exam data from idb %o", e);
    }
    const scoresToStore = scores.filter((a) => a.pageId );
    const answersToStore = answers.filter((a) => a.pageId );
    scoresToStore.forEach((action) => {
        // update exam score without causing a riot update
        addExamScore(action.pageId, action.date, action.score, false);
    });
    answersToStore.forEach((action) => {
        // update exam answer without causing a riot update
        addExamAnswer(action.pageId, action.date, action.score, false);
    });
    if (scoresToStore.length + answersToStore.length) {
        // cause riot to update
        bumpExamStoreVersion();
    }
}

export function persistExamScore(pageId, score, extraDataObject = {}) {
    const extraData = Object.assign(extraDataObject, {
        date: new Date(),
        score: score,
    });
    storeExamScore(pageId, extraData);

    // store the action ( via idb and api )
    saveAndPostAction(EXAM_FINAL_SCORE_TYPE, { pageId, ...extraData });
}

export function persistExamAnswer(pageId, questionId, answer, extraDataObject = {}) {
    const extraData = Object.assign(extraDataObject, {
        date: new Date(),
        questionId,
        answer,
    });
    storeExamAnswer(pageId, extraData);

    // store the action ( via idb and api )
    saveAndPostAction(EXAM_ANSWER_TYPE, { pageId, ...extraData });
}
