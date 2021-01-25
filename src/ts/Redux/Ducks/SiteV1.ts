// ACTIONS
const ADDED_MANIFEST_V1 = "site/addedManifestV1";
const ADDED_PAGE_V2 = "site/addedPageV2";

// ACTION TYPE
type TActionManifestV1 = { type: typeof ADDED_MANIFEST_V1; manifestV1: any };
type TActionPageV2 = { type: typeof ADDED_PAGE_V2; pageV2: any };

// ACTION CREATORS
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const addManifestV1 = (manifestV1: any): TActionManifestV1 => ({
    type: ADDED_MANIFEST_V1,
    manifestV1,
});
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const addPageV2 = (pageV2: any): TActionPageV2 => ({
    type: ADDED_PAGE_V2,
    pageV2,
});

// REDUCERS
const manifestV1 = (state = {}, action: TActionManifestV1): any => {
    switch (action.type) {
        case ADDED_MANIFEST_V1:
            return action.manifestV1;
        default:
            return state;
    }
};
const pageV2 = (state = {}, action: TActionPageV2): any => {
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
