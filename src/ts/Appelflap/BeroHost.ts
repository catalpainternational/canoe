import { AppelflapConnect } from "./AppelflapConnect";
import Logger from "../Logger";

const logger = new Logger("BeroHost");

export class BeroHost {
    //#region Implement as Singleton
    static instance: BeroHost;

    private constructor() {
        logger.log("Singleton created");
    }

    /** Gets the single instance of BeroHost */
    public static getInstance(): BeroHost {
        if (!BeroHost.instance) {
            BeroHost.instance = new BeroHost();
        }

        return BeroHost.instance;
    }
    //#endregion

    /** Tell Appelflap that Bero is 'locked'
     * and should not be rebooted */
    LockBero = async (): Promise<string> => {
        if (AppelflapConnect.getInstance()) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            return await AppelflapConnect.getInstance()!.lock();
        }
        return "notOk";
    };

    StartBero = async (startUp: () => void): Promise<boolean> => {
        let lockResult = true;
        logger.info("Starting Bero");
        if (AppelflapConnect.getInstance()) {
            logger.info("Calling Appelflap to 'lock' Bero");
            try {
                const lockText = await this.LockBero();
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
