import { combineReducers } from "redux";

import siteReducer from "./ducks/Site";
import languageReducer from "./ducks/i18n";
import guestBannerReducer from "./ducks/GuestBanner";
import browserSupportReducer from "./ducks/BrowserSupport";
import areCompletionsReady from "./ducks/Actions";

export const reducers = combineReducers({
    ...siteReducer,
    ...languageReducer,
    ...guestBannerReducer,
    ...browserSupportReducer,
    ...areCompletionsReady,
});
