import { AppelflapConnect } from "./AppelflapConnect";
import { TPublications, TPublication } from "./Types/CacheTypes";

export class CachePublish {
    #afc: AppelflapConnect;

    constructor(afc: AppelflapConnect) {
        this.#afc = afc;
    }

    /** Get a list of published items from Appelflap */
    publications = async (): Promise<TPublications> => {
        return await this.#afc.getPublications();
    };

    /** Instructs Appelflap to 'publish' a single publication */
    publish = async (publication: TPublication): Promise<void> => {
        await this.#afc.publish(publication);
    };

    /** Instructs Appelflap to cease publishing a single publication */
    unpublish = async (publication: TPublication): Promise<void> => {
        await this.#afc.unpublish(publication);
    };
}
