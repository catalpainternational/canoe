// ACTIONS
const CHANGED_SERVICE_WORKER_STATE = "serviceWorker/changedState";

// ACTION CREATOR
export const serviceWorkerStateAction = (eventType) => {
    return {
        type: CHANGED_SERVICE_WORKER_STATE,
        eventType,
    };
};

// REDUCER
const serviceWorkerState = (state = "unknown", action) => {
    switch (action.type) {
        case CHANGED_SERVICE_WORKER_STATE:
            switch (action.eventType) {
                case "controlling":
                    return "controlling";
                case "redundant":
                    return state === "controlling" ? "update-waiting" : "install-failed";
                case "update-waiting":
                    return "update-waiting";
                case "skip_sw":
                    return "skip_sw";
                case "notsupported":
                    return "notsupported";
                default:
                    return "unknown";
            }
        default:
            return state;
    }
};

// EXPORTED REDUCER
export default {
    serviceWorkerState,
};
