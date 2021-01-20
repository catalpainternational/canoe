// ACTIONS
const ADDED_MANIFEST_V2 = "site/addedManifestV2";

// ACTION TYPE
type TActionManifestV2 = { type: typeof ADDED_MANIFEST_V2; manifestV2: any };

// ACTION CREATORS
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const addManifestV2 = (manifestV2: any): TActionManifestV2 => ({
    type: ADDED_MANIFEST_V2,
    manifestV2,
});

// REDUCERS
const manifestV2 = (state = {}, action: TActionManifestV2): any => {
    switch (action.type) {
        case ADDED_MANIFEST_V2:
            return action.manifestV2;
        default:
            return state;
    }
};

// EXPORTED REDUCER
export default {
    manifestV2,
};
