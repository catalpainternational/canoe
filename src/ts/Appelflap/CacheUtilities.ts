/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { AppelflapConnect } from "./AppelflapConnect";

export class CacheUtilities {
    /**
     * Get the status of the cache from Appelflap
     * @deprecated No longer available from Appelflap, returns 404
     */
    static async status(): Promise<any> {
        if (AppelflapConnect.getInstance()) {
            return JSON.parse(
                await AppelflapConnect.getInstance()!.getCacheStatus()
            );
        }
        return {};
    }

    /** Instruct Appelflap to hard reboot Bero */
    static async rebootHard(): Promise<void> {
        if (AppelflapConnect.getInstance()) {
            await AppelflapConnect.getInstance()!.doRebootHard();
        }
    }

    /** Instruct Appelflap to soft reboot Bero */
    static async rebootSoft(): Promise<void> {
        if (AppelflapConnect.getInstance()) {
            await AppelflapConnect.getInstance()!.doRebootSoft();
        }
    }

    /** Instruct Appelflap to launch the Android WiFi picker */
    static async launchWiFiPicker(): Promise<void> {
        if (AppelflapConnect.getInstance()) {
            await AppelflapConnect.getInstance()!.doLaunchWiFiPicker();
        }
    }

    /** Instruct Appelflap to launch the Android storage manager */
    static async launchStorageManager(): Promise<void> {
        if (AppelflapConnect.getInstance()) {
            await AppelflapConnect.getInstance()!.doLaunchStorageManager();
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
