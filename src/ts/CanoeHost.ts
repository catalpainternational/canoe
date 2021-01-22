import { inAppelflap } from "ts/PlatformDetection";
import { AppelflapConnect } from "ts/AppelflapConnect";

export class CanoeHost {
    #afc?: AppelflapConnect;

    constructor() {
        this.#afc = inAppelflap() ? new AppelflapConnect() : undefined;
    }

    get appelflapConnect(): AppelflapConnect | undefined {
        return this.#afc;
    }

    /** Tell Appelflap that Canoe is 'locked'
     * and should not be rebooted */
    LockCanoe = async (): Promise<string> => {
        return this.#afc ? await this.#afc.lock() : "notOk";
    };

    StartCanoe = async (startUp: () => void): Promise<boolean> => {
        let lockResult = true;
        if (inAppelflap()) {
            try {
                lockResult = (await this.LockCanoe()) === "ok";
            } catch {
                // We don't know why Appelflap is thought to be around, and yet it failed.
                lockResult = false;
            }
        }

        startUp();

        // If lockResult is false, the app is probably still usable.
        // However, we do not yet understand what this means for the user and the app.
        return lockResult
            ? Promise.resolve(lockResult)
            : Promise.reject(lockResult);
    };
}
