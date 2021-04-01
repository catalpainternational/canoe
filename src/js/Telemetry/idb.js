import { createStore, set, del, keys, clear, get } from "idb-keyval";
import { v4 as uuidv4 } from "uuid";

const ACTION_TYPE = "feedback";
const DB_NAME = "feedback";
const STORE_NAME = "keyval";

const FEEDBACK_STORE = createStore(DB_NAME, STORE_NAME);

export const saveFeedbackToIdb = async (feedback) => {
    if (!feedback.date) {
        throw new Error('Feedback object must have a "date" field.');
    }
    const uuid = uuidv4();
    feedback.uuid = uuid;
    feedback.type = ACTION_TYPE;
    return await set(uuid, feedback, FEEDBACK_STORE);
};

export const getFeedbackFromIdb = async (key) => {
    return await get(key, FEEDBACK_STORE);
};

export const getFeedbackKeysFromIdb = async () => {
    return await keys(FEEDBACK_STORE);
};

export const deleteFeedbackFromIdb = async (key) => {
    return await del(key, FEEDBACK_STORE);
};

export const clearFeedbackFromIdb = async () => {
    return await clear(FEEDBACK_STORE);
};

export default saveFeedbackToIdb;
