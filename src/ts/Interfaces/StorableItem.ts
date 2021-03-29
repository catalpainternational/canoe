import { TItemCommon } from "../Types/PublishableItemTypes";

export interface StorableItem {
    saveToStore(data: TItemCommon): void;
    storedData: TItemCommon | undefined;
}
