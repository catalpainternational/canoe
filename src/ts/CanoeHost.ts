import { inAppelflap } from "./PlatformDetection";
import { AppelflapConnect } from "./AppelflapConnect";
import Logger from "./Logger";

const logger = new Logger("CanoeHost");

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
        logger.info("Starting Bero");
        if (inAppelflap()) {
            logger.info("Calling Appelflap to 'lock' Bero");
            try {
                const lockText = await this.LockCanoe();
                lockResult = lockText.toLowerCase() === "ok";
            } catch (e) {
                // We don't know why Appelflap is thought to be around, and yet it failed.
                logger.warn(`Appelflap could not achieve 'lock' ${e}`);
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
