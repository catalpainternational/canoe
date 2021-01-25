import { store } from "ReduxImpl/Store";

import {
    addManifestV1 as addManifestV1Action,
    addPageV2 as addPageV2Action,
} from "ts/Redux/Ducks/SiteV1";

import { TManifest, TPage } from "../Types/ManifestTypes";

export const storeManifestV1 = (manifestV1: TManifest): void => {
    store.dispatch(addManifestV1Action(manifestV1));
};

export const storePageV2 = (pageV2: TPage): void => {
    store.dispatch(addPageV2Action(pageV2));
};
