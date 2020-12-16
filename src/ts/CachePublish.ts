import { AppelflapConnect } from "./AppelflapConnect";
import {
    TPublicationTarget,
    TPublications,
    TPublication,
} from "./Types/CacheTypes";

export class CachePublish {
    #afc = new AppelflapConnect();

    /** Get a list of published items from Appelflap */
    publications = async (): Promise<TPublications> => {
        const publicationList = await this.#afc.getPublications();
        return JSON.parse(publicationList) as TPublications;
    };

    /** Instructs Appelflap to 'publish' a single publication */
    publish = async (publication: TPublication): Promise<void> => {
        await this.#afc.publish(publication);
    };

    /** Instructs Appelflap to cease publishing a single publication */
    unpublish = async (publication: TPublicationTarget): Promise<void> => {
        await this.#afc.unpublish(publication);
    };
}
