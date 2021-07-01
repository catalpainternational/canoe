/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { AppelflapConnect } from "./AppelflapConnect";
import { TPublication } from "../Types/CacheTypes";
import { TBundles } from "../Types/BundleTypes";
import { NOT_RELEVANT } from "../Constants";

export class CachePublish {
    /** Get a list of published items from Appelflap */
    static async publications(): Promise<TBundles> {
        if (AppelflapConnect.getInstance()) {
            return await AppelflapConnect.getInstance()!.getPublications();
        }
        return { bundles: [] };
    }

    /** Instructs Appelflap to 'publish' a single publication */
    static async publish(publication: TPublication): Promise<string> {
        if (AppelflapConnect.getInstance()) {
            return await AppelflapConnect.getInstance()!.publish(publication);
        }
        return Promise.resolve(NOT_RELEVANT);
    }

    /** Instructs Appelflap to cease publishing a single publication */
    static async unpublish(publication: TPublication): Promise<void> {
        if (AppelflapConnect.getInstance()) {
            await AppelflapConnect.getInstance()!.unpublish(publication);
        }
    }
}
