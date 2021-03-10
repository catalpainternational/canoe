import { TWagtailPage } from "ts/Types/PageTypes";
import { TItemCommon, TPublishableItem } from "ts/Types/PublishableItemTypes";

export type TManifestData = {
    pages: Record<string, TWagtailPage>;
} & TItemCommon;

export type TManifest = TManifestData & TPublishableItem;
