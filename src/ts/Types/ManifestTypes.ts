import { TWagtailPage } from "ts/Types/PageTypes";
import {
    TPublishableItem,
    TPublishableItemState,
} from "ts/Types/PublishableItemTypes";

export type TManifestData = {
    pages: Record<string, TWagtailPage>;
} & TPublishableItem;

export type TManifest = TManifestData & TPublishableItemState;
