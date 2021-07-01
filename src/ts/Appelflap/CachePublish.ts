import { AppelflapConnect } from "./AppelflapConnect";
import { TPublications, TPublication } from "../Types/CacheTypes";

export class CachePublish {
    /** Get a list of published items from Appelflap */
    static async publications(): Promise<TPublications> {
        if (AppelflapConnect.Instance) {
            return await AppelflapConnect.Instance.getPublications();
        }
        return {};
    }

    /** Instructs Appelflap to 'publish' a single publication */
    static async publish(publication: TPublication): Promise<void> {
        if (AppelflapConnect.Instance) {
            await AppelflapConnect.Instance.publish(publication);
        }
    }

    /** Instructs Appelflap to cease publishing a single publication */
    static async unpublish(publication: TPublication): Promise<void> {
        if (AppelflapConnect.Instance) {
            await AppelflapConnect.Instance.unpublish(publication);
        }
    }
}
