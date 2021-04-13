import { combineReducers } from "redux";

import siteReducer from "./ducks/Site";
import languageReducer from "./ducks/i18n";
import serviceWorkerReducer from "./ducks/ServiceWorker";
import guestBannerReducer from "./ducks/GuestBanner";
import browserSupportReducer from "./ducks/BrowserSupport";
import online from "./ducks/Online";
import identity from "./ducks/Identity";
import route from "./ducks/Route";
import completion from "./ducks/Completion";
import exams from "./ducks/Exam";

export const reducers = combineReducers({
    ...siteReducer,
    ...languageReducer,
    ...serviceWorkerReducer,
    ...guestBannerReducer,
    ...browserSupportReducer,
    ...online,
    ...identity,
    ...route,
    ...completion,
    ...exams,
});
