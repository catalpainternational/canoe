import { inAppelflap } from "ts/PlatformDetection";
import { AppelflapConnect } from "ts/AppelflapConnect";

export class CanoeHost {
    /** Tell Appelflap that Canoe is 'locked'
     * and should not be rebooted */
    LockCanoe = async (): Promise<string> => {
        const appelflapConnect = new AppelflapConnect();
        return await appelflapConnect.lock();
    };

    /** Start Canoe, if there is a host then this will start Canoe `within` that host
     * @param { function } startUp a void returning function to be executed
     * after this StartCanoe method has done its thing.
     * Use `() => {}` when calling this method if you do not want anything to be executed.
     */
    StartCanoe = (startUp: () => void): void => {
        if (inAppelflap()) {
            this.LockCanoe()
                .then((lockResult) => {
                    if (lockResult !== "ok") {
                        // The lock didn't succeed, the app is probably still usable.
                        // We don't yet understand what this means for the user and the app.
                        // Should we show a small warning?
                    }

                    startUp();
                })
                .catch(() => {
                    /* Do nothing */
                });
        } else {
            startUp();
        }
    };
}
