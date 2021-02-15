// js/redux/Store

/** Note that the module name here MUST match how it's used in the .ts files */
declare module "ReduxImpl/Store" {
    import { TPublishableItemStatus } from "src/ts/Types/PublishableItemTypes";
    import { TPublishableItemStateActionType } from "src/ts/redux/ducks/PublishableItem";

    interface Store {
        dispatch(action: TPublishableItemStateActionType): void;
        getState(): { publishableItemStates: TPublishableItemStatus | unknown };
    }

    export const store: Store;
}
