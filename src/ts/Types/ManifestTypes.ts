import { TWagtailPage } from "./PageTypes";
import { TItemCommon } from "./PublishableItemTypes";

export type TManifestData = {
    pages: Record<string, TWagtailPage>;
} & TItemCommon;
