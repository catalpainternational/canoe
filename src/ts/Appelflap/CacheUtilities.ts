import { AppelflapConnect } from "./AppelflapConnect";

export class CacheUtilities {
    #afc: AppelflapConnect;

    constructor(afc: AppelflapConnect) {
        this.#afc = afc;
    }

    /** Get the status of the cache from Appelflap */
    status = async (): Promise<any> => {
        const statusDescription = await this.#afc.getCacheStatus();
        return JSON.parse(statusDescription);
    };

    /** Instruct Appelflap to reboot Bero */
    reboot = async (): Promise<void> => {
        await this.#afc.doReboot();
    };

    /** Instruct Appelflap to consider the cache as 'locked' */
    lock = async (): Promise<void> => {
        await this.#afc.lock();
    };

    /** Instruct Appelflap to consider the cache as 'unlocked' */
    unlock = async (): Promise<void> => {
        await this.#afc.unlock();
    };
}
