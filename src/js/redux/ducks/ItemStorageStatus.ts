import { TItemStorageStatus } from "ts/Types/PublishableItemTypes";

// ACTIONS
const ADDED_ITEMSTORAGESTATUS = "site/addedItemStorageStatus";

// ACTION TYPE
export type TItemStorageStatusActionType = {
    type: typeof ADDED_ITEMSTORAGESTATUS;
    itemId: string;
    itemState: TItemStorageStatus;
};

// ACTION CREATORS
export const addItemStorageStatusAction = (
    itemId: string,
    itemState: TItemStorageStatus
): TItemStorageStatusActionType => ({
    type: ADDED_ITEMSTORAGESTATUS,
    itemId,
    itemState,
});

// REDUCERS
const itemStorageStatuses = (
    state: Record<string, any> = {},
    action: TItemStorageStatusActionType
): TItemStorageStatus | unknown => {
    switch (action.type) {
        case ADDED_ITEMSTORAGESTATUS:
            // eslint-disable-next-line no-case-declarations
            const nextState = Object.assign({}, state);
            nextState[action.itemId] = action.itemState;
            return nextState;
        default:
            return null;
    }
};

// EXPORTED REDUCER
export default {
    itemStorageStatuses,
};
