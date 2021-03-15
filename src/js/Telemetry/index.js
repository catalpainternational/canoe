import { ROUTES_FOR_REGISTRATION } from "js/urls";
import { getAuthenticationToken } from "js/AuthenticationUtilities";
import {
    getFeedbackKeysFromIdb,
    getFeedbackFromIdb,
    deleteFeedbackFromIdb,
} from "./idb";

const EVERY_THIRTY_MINUTES = 1000 * 60 * 30;
const ACTIONS_ENDPOINT = ROUTES_FOR_REGISTRATION.actions;

const createPOSTRequest = (path, body) => {
    const requestContent = {
        method: "POST",
        body: JSON.stringify(body),
        mode: "cors",
        headers: {
            "Content-Type": "application/json",
        },
    };

    const token = getAuthenticationToken();
    if (token) {
        requestContent.headers.Authorization = `JWT ${token}`;
    }
    return new Request(ACTIONS_ENDPOINT, requestContent);
};

const postFeedback = async (feedback) => {
    try {
        return await fetch(createPOSTRequest(ACTIONS_ENDPOINT, feedback));
    } catch (err) {
        throw err;
    }
};

const syncFeedback = async () => {
    const feedbackKeys = await getFeedbackKeysFromIdb();
    for (const feedbackKey of feedbackKeys) {
        const feedback = await getFeedbackFromIdb(feedbackKey);

        try {
            const response = await postFeedback(feedback);
            if (response.ok) {
                await deleteFeedbackFromIdb(feedbackKey);
            }
        } catch (err) {
            if (err instanceof TypeError && err.message === "Failed to fetch") {
                console.log("Feedback didn't post, but will not be deleted.");
                // Thrown when network fails.
                return;
            }
            console.log(
                "Posting Feedback threw a 500, so we're deleting our local copy."
            );
            await deleteFeedbackFromIdb(feedbackKey);
        }
    }
};

const initialiseFeedback = () => {
    syncFeedback();
    window.setInterval(syncFeedback, EVERY_THIRTY_MINUTES);
};

export default initialiseFeedback;
