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

    /**
     * Inject all relevant bundles into the browser's cache
     * @remarks When this call returns it indicates conclusively that cache syncing has completed
     */
    static async injectAll(): Promise<void> {
        if (AppelflapConnect.getInstance()) {
            await AppelflapConnect.getInstance()!.injectAll();
        }
    }
}
