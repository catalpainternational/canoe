import { store } from "ReduxImpl/Store";

import {
    addManifestV1 as addManifestV1Action,
    addPageV2 as addPageV2Action,
} from "ts/Redux/Ducks/SiteV1";

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const storeManifestV1 = (manifestV1: any): void => {
    store.dispatch(addManifestV1Action(manifestV1));
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const storePageV2 = (pageV2: any): void => {
    store.dispatch(addPageV2Action(pageV2));
};
