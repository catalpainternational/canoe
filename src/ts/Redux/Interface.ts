import { store } from "ReduxImpl/Store";

import { addManifestV1 as addManifestV1Action } from "ts/Redux/Ducks/SiteV1";

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const storeManifestV1 = (manifestV1: any): void => {
    store.dispatch(addManifestV1Action(manifestV1));
};
