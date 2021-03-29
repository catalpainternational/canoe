import { TWagtailPage } from "ts/Types/PageTypes";
import { TItemCommon } from "ts/Types/PublishableItemTypes";

export type TManifestData = {
    pages: Record<string, TWagtailPage>;
} & TItemCommon;
