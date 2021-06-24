/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { AppelflapConnect } from "./AppelflapConnect";
import { TPublications, TPublication } from "../Types/CacheTypes";

export class CachePublish {
    /** Get a list of published items from Appelflap */
    static async publications(): Promise<TPublications> {
        if (AppelflapConnect.getInstance()) {
            return await AppelflapConnect.getInstance()!.getPublications();
        }
        return {};
    }

    /** Instructs Appelflap to 'publish' a single publication */
    static async publish(publication: TPublication): Promise<void> {
        if (AppelflapConnect.getInstance()) {
            await AppelflapConnect.getInstance()!.publish(publication);
        }
    }

    /** Instructs Appelflap to cease publishing a single publication */
    static async unpublish(publication: TPublication): Promise<void> {
        if (AppelflapConnect.getInstance()) {
            await AppelflapConnect.getInstance()!.unpublish(publication);
        }
    }
}
