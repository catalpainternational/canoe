import { store } from "ReduxImpl/Store";

import { addManifestV2 as addManifestV2Action } from "ts/Redux/Ducks/SiteV2";

export const storeManifestV2 = (manifestV2: any) => {
    store.dispatch(addManifestV2Action(manifestV2));
};
