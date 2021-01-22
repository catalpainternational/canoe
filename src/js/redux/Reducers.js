import { combineReducers } from "redux";

import siteReducer from "./ducks/Site";
import siteV1Reducer from "../../ts/Redux/Ducks/SiteV1";
import languageReducer from "./ducks/i18n";
import serviceWorkerReducer from "./ducks/ServiceWorker";
import guestBannerReducer from "./ducks/GuestBanner";
import browserSupportReducer from "./ducks/BrowserSupport";
import areCompletionsReady from "./ducks/Actions";

export const reducers = combineReducers({
    ...siteReducer,
    ...siteV1Reducer,
    ...languageReducer,
    ...serviceWorkerReducer,
    ...guestBannerReducer,
    ...browserSupportReducer,
    ...areCompletionsReady,
});
