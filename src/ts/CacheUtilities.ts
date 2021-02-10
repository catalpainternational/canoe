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

    /** Get the list of cache keys from the browser
     * @remarks workbox related cache keys are automagically excluded from this list
     */
    cacheKeys = async (): Promise<string[]> => {
        const keys = await caches.keys();
        return keys.filter((key) => key.indexOf("workbox") === -1);
    };

    /** Instruct Appelflap to reboot Canoe */
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
