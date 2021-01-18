import { inAppelflap } from "ts/PlatformDetection";
import { AppelflapConnect } from "ts/AppelflapConnect";
import { TCertificate } from "./Types/CacheTypes";

export class CanoeHost {
    #afc?: AppelflapConnect;
    #packageCert?: TCertificate;

    constructor() {
        this.#afc = inAppelflap() ? new AppelflapConnect() : undefined;
    }

    /** Tell Appelflap that Canoe is 'locked'
     * and should not be rebooted */
    LockCanoe = async (): Promise<string> => {
        return this.#afc ? await this.#afc.lock() : "notOk";
    };

    private GetPackageCertificateFromAppelflap = async (): Promise<
        TCertificate | undefined
    > => {
        return this.#afc ? await this.#afc.getCertificate() : undefined;
    };

    get packageCertificate(): TCertificate | undefined {
        return this.#packageCert;
    }

    StartCanoe = async (startUp: () => void): Promise<boolean> => {
        let lockResult = true;
        if (inAppelflap()) {
            try {
                lockResult = (await this.LockCanoe()) === "ok";
            } catch {
                // We don't know why Appelflap is thought to be around, and yet it failed.
                lockResult = false;
            }

            // if (lockResult) {
            try {
                this.#packageCert = await this.GetPackageCertificateFromAppelflap();
            } catch {
                // No signed cert
            }
            // }
        }

        startUp();

        // If lockResult is false, the app is probably still usable.
        // However, we do not yet understand what this means for the user and the app.
        return lockResult
            ? Promise.resolve(lockResult)
            : Promise.reject(lockResult);
    };
}
