/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { AppelflapConnect } from "./AppelflapConnect";

export class CacheUtilities {
    /** Get the status of the cache from Appelflap */
    static async status(): Promise<any> {
        if (AppelflapConnect.getInstance()) {
            return JSON.parse(
                await AppelflapConnect.getInstance()!.getCacheStatus()
            );
        }
        return {};
    }

    /** Instruct Appelflap to reboot Bero */
    static async reboot(): Promise<void> {
        if (AppelflapConnect.getInstance()) {
            await AppelflapConnect.getInstance()!.doReboot();
        }
    }

    /** Instruct Appelflap to consider the cache as 'locked' */
    static async lock(): Promise<void> {
        if (AppelflapConnect.getInstance()) {
            await AppelflapConnect.getInstance()!.lock();
        }
    }

    /** Instruct Appelflap to consider the cache as 'unlocked' */
    static async unlock(): Promise<void> {
        if (AppelflapConnect.getInstance()) {
            await AppelflapConnect.getInstance()!.unlock();
        }
    }
}
