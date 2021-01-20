import { store } from "ReduxImpl/Store";

import { addManifestV2 as addManifestV2Action } from "ts/Redux/Ducks/SiteV2";

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const storeManifestV2 = (manifestV2: any): void => {
    store.dispatch(addManifestV2Action(manifestV2));
};
