import { combineReducers } from "redux";

import siteReducer from "./ducks/Site";
import languageReducer from "./ducks/i18n";
import serviceWorkerReducer from "./ducks/ServiceWorker";
import guestBannerReducer from "./ducks/GuestBanner";
import browserSupportReducer from "./ducks/BrowserSupport";
import areCompletionsReady from "./ducks/Actions";
import online from "./ducks/Online";
import identity from "./ducks/Identity";
import route from "./ducks/Route";
import publishableItemStatuses from "./ducks/PublishableItem";

export const reducers = combineReducers({
    ...siteReducer,
    ...languageReducer,
    ...serviceWorkerReducer,
    ...guestBannerReducer,
    ...browserSupportReducer,
    ...areCompletionsReady,
    ...online,
    ...identity,
    ...route,
    ...publishableItemStatuses,
});
