/* Exam results module
 * The access point for interface components to set and query exam scores
 * All interface methods should be synchronous.
 * Depends on the action_store module to persist information
 */

import { storeExamScores, clearExamScores } from "js/redux/Interface";
import { 
    saveAndPostAction, readActions,
    EXAM_SCORE_TYPE,
} from "./ActionsStore";
import Logger from "../../ts/Logger";

const logger = new Logger("Exam Scores");

/**
 * Clear the in memory store of exam scores - for use on logout
 */
export const clearStateExamData = () => {
    clearExamScores();
};

/**
 * Read exam scores from store and update redux state
 */
export async function readExamDataIntoState() {
    let scores, answers;
    try {
        scores = await readActions(EXAM_SCORE_TYPE);
    } catch (e) {
        logger.warn("Error in reading exam data from idb %o", e);
    }
    const scoresToStore = scores.filter((a) => a.pageId);
    storeExamScores(scoresToStore);
}

/**
 * Store an exam score, persist locally, and send to api
 * @param {*} pageId - the id of the page the exam is on
 * @param {*} score - the score in the exam
 * @param {*} scoreData - extra data to persist
 * @returns the action stored 
 */
export function persistExamScore(pageId, scoreData) {
    const extraData = Object.assign(scoreData, {
        date: new Date(),
    });

    // store and return the action ( asycronously persists via idb and api )
    return saveAndPostAction(EXAM_SCORE_TYPE, { pageId, ...extraData });
}
