// ACTIONS
const CHANGED_LANGUAGE = "i18n/changedLanguage";

// ACTION CREATORS
export const changeLanguage = (language) => ({ type: CHANGED_LANGUAGE, language });

// REDUCER
const language = (state = "", action) => {
    switch (action.type) {
        case CHANGED_LANGUAGE:
            return action.language;
        default:
            return state;
    }
};

// EXPORTED REDUCER
export default { language };
