import { TPublishableItemStatus } from "ts/Types/PublishableItemTypes";

import { addPublishableItemStatusAction } from "ts/redux/ducks/PublishableItem";

import { store } from "ReduxImpl/Store";

export const storePublishableItemStatus = (
    itemId: string,
    itemState: TPublishableItemStatus
): void => {
    store.dispatch(addPublishableItemStatusAction(itemId, itemState));
};

/** Get the publishable item's status
 * @returns the publishable item's status or null
 * @remarks test for null first, before casting the return `as TPublishableItemStatus`
 */
export const getPublishableItemStatus = (
    itemId: string
): TPublishableItemStatus | unknown => {
    const publishableItemStatuses = store.getState().publishableItemStates;
    if (publishableItemStatuses === null) {
        return publishableItemStatuses;
    }

    return (
        (publishableItemStatuses as Record<string, TPublishableItemStatus>)[
            itemId
        ] || null
    );
};

/** Get the status for all publishable items
 * @returns each publishable item's status as an array
 */
export const getPublishableItemStatuses = (): TPublishableItemStatus[] => {
    const publishableItemStatuses = store.getState().publishableItemStates;
    if (publishableItemStatuses === null) {
        return [];
    }

    return publishableItemStatuses as TPublishableItemStatus[];
};
