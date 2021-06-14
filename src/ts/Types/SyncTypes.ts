import { TAppelflapResult } from "./CanoeEnums";

export type TSyncData = Record<
    string,
    {
        published: TAppelflapResult;
        unpublished: TAppelflapResult;
    }
>;

export type TPublishResult = Record<
    string,
    { result: TAppelflapResult; reason: any }
>;
