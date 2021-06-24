import { AppelflapConnect } from "./AppelflapConnect";

export class CacheUtilities {
    /**
     * Get the status of the cache from Appelflap
     * @deprecated No longer available from Appelflap, returns 404
     */
    static async status(): Promise<any> {
        if (AppelflapConnect.Instance) {
            const cacheStatus =
                await AppelflapConnect.Instance.getCacheStatus();
            return JSON.parse(cacheStatus);
        }
        return {};
    }

    /** Instruct Appelflap to reboot Bero */
    static async reboot(): Promise<void> {
        if (AppelflapConnect.Instance) {
            await AppelflapConnect.Instance.doReboot();
        }
    }

    /** Instruct Appelflap to consider the cache as 'locked' */
    static async lock(): Promise<void> {
        if (AppelflapConnect.Instance) {
            await AppelflapConnect.Instance.lock();
        }
    }

    /** Instruct Appelflap to consider the cache as 'unlocked' */
    static async unlock(): Promise<void> {
        if (AppelflapConnect.Instance) {
            await AppelflapConnect.Instance.unlock();
        }
    }
}
