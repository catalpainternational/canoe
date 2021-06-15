import { AppelflapConnect } from "./AppelflapConnect";

export class CacheUtilities {
    /** Get the status of the cache from Appelflap */
    static async status(): Promise<any> {
        if (AppelflapConnect.Instance) {
            return JSON.parse(await AppelflapConnect.Instance.getCacheStatus());
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
