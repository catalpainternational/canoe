import { TAppelflapResult } from "./CanoeEnums";

export type TSyncData = Record<
    string,
    {
        published: TAppelflapResult;
        unpublished: TAppelflapResult;
    }
>;
