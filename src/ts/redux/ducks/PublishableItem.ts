import { TPublishableItemStatus } from "src/ts/Types/PublishableItemTypes";

// ACTIONS
const ADDED_PUBLISHABLEITEM_STATUS = "site/addedPublishableItemStatus";

// ACTION TYPE
export type TPublishableItemStatusActionType = {
    type: typeof ADDED_PUBLISHABLEITEM_STATUS;
    itemId: string;
    itemState: TPublishableItemStatus;
};

// ACTION CREATORS
export const addPublishableItemStatusAction = (
    itemId: string,
    itemState: TPublishableItemStatus
): TPublishableItemStatusActionType => ({
    type: ADDED_PUBLISHABLEITEM_STATUS,
    itemId,
    itemState,
});

// REDUCERS
const publishableItemStatuses = (
    state: Record<string, any> = {},
    action: TPublishableItemStatusActionType
): TPublishableItemStatus | unknown => {
    switch (action.type) {
        case ADDED_PUBLISHABLEITEM_STATUS:
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
    publishableItemStatuses,
};
