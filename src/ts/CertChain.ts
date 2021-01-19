import { AppelflapConnect } from "ts/AppelflapConnect";
import { TCertificate } from "./Types/CacheTypes";

export class CertChain {
    #afc?: AppelflapConnect;
    #packageCert?: TCertificate;

    constructor(afc: AppelflapConnect) {
        this.#afc = afc;
    }

    get packageCertificate(): TCertificate | undefined {
        return this.#packageCert;
    }

    async initialise(): Promise<boolean> {
        try {
            this.#packageCert = await this.GetPackageCertificateFromAppelflap();
            if (!this.#packageCert?.isCertSigned) {
                this.PostPackageCertificateForSigning();
            }
        } catch {
            // No signed cert
            this.#packageCert = undefined;
        }
        return !!this.#packageCert;
    }

    private GetPackageCertificateFromAppelflap = async (): Promise<
        TCertificate | undefined
    > => {
        return this.#afc ? await this.#afc.getCertificate() : undefined;
    };

    private PostPackageCertificateForSigning = async (): Promise<
        TCertificate | undefined
    > => {
        return undefined;
    };
}
