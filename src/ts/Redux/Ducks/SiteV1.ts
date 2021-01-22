// ACTIONS
const ADDED_MANIFEST_V1 = "site/addedManifestV1";

// ACTION TYPE
type TActionManifestV1 = { type: typeof ADDED_MANIFEST_V1; manifestV1: any };

// ACTION CREATORS
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const addManifestV1 = (manifestV1: any): TActionManifestV1 => ({
    type: ADDED_MANIFEST_V1,
    manifestV1,
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

// EXPORTED REDUCER
export default {
    manifestV1,
};
