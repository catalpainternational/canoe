import { inAppelflap } from "ts/PlatformDetection";
import { AppelflapConnect } from "ts/AppelflapConnect";
import { CertChain } from "./CertChain";

export class CanoeHost {
    #afc?: AppelflapConnect;

    constructor() {
        this.#afc = inAppelflap() ? new AppelflapConnect() : undefined;
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

            if (this.#afc) {
                try {
                    const certChain = new CertChain(this.#afc);
                    const hasCert = await certChain.initialise();
                    const packageCert = certChain.packageCertificate;
                    console.log(JSON.stringify(packageCert));
                    console.log(btoa(packageCert?.cert || ""));
                } catch {
                    // No signed cert
                }
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
