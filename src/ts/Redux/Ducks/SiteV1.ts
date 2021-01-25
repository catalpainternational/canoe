import { TManifest, TPage } from "src/ts/Types/ManifestTypes";
import { Manifest } from "ts/Implementations/Manifest";
import { Page } from "ts/Implementations/Page";

// ACTIONS
const ADDED_MANIFEST_V1 = "site/addedManifestV1";
const ADDED_PAGE_V2 = "site/addedPageV2";

// ACTION TYPE
type TActionManifestV1 = {
    type: typeof ADDED_MANIFEST_V1;
    manifestV1: TManifest;
};
type TActionPageV2 = { type: typeof ADDED_PAGE_V2; pageV2: TPage };

// ACTION CREATORS
export const addManifestV1 = (manifestV1: TManifest): TActionManifestV1 => ({
    type: ADDED_MANIFEST_V1,
    manifestV1,
});
export const addPageV2 = (pageV2: TPage): TActionPageV2 => ({
    type: ADDED_PAGE_V2,
    pageV2,
});

// REDUCERS
const manifestV1 = (
    state = Manifest.emptyItem,
    action: TActionManifestV1
): TManifest => {
    switch (action.type) {
        case ADDED_MANIFEST_V1:
            return action.manifestV1;
        default:
            return state;
    }
};
const pageV2 = (state = Page.emptyItem, action: TActionPageV2): TPage => {
    switch (action.type) {
        case ADDED_PAGE_V2:
            return action.pageV2;
        default:
            return state;
    }
};

// EXPORTED REDUCER
export default {
    manifestV1,
    pageV2,
};
