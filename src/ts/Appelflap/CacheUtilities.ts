/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { AppelflapConnect } from "./AppelflapConnect";

export class CacheUtilities {
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
