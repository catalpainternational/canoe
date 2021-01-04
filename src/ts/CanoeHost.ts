import { inAppelflap } from "ts/PlatformDetection";
import { AppelflapConnect } from "ts/AppelflapConnect";

export class CanoeHost {
    /** Tell Appelflap that Canoe is 'locked'
     * and should not be rebooted */
    LockCanoe = async (): Promise<string> => {
        const appelflapConnect = new AppelflapConnect();
        return await appelflapConnect.lock();
    };

    StartCanoe = (riotStart: () => void): void => {
        if (inAppelflap()) {
            this.LockCanoe()
                .then((lockResult) => {
                    if (lockResult !== "ok") {
                        // The lock didn't succeed, the app is probably still usable.
                        // We don't yet understand what this means for the user and the app.
                        // Should we show a small warning?
                    }

                    riotStart();
                })
                .catch(() => {
                    /* Do nothing */
                });
        } else {
            riotStart();
        }
    };
}
