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
        let responseFailure = "";
        try {
            const init = {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `JWT ${getAuthenticationToken()}`,
                },
            } as RequestInit;
            const resp = await fetch(MANIFEST_URL, init);
            if (!resp.ok) {
                responseFailure = "Http error getting manifest";
            } else {
                return resp.json();
            }
        } catch {
            responseFailure = "Error getting manifest";
        }

        return undefined;
    };


    async fetchManifest(): Promise<any> {
        return buildFakeManifest();
        // let responseFailure = "";
        // try {
        //     const init = {
        //         method: "GET",
        //         headers: {
        //             "Content-Type": "application/json",
        //             Authorization: `JWT ${getAuthenticationToken()}`,
        //         },
        //     } as RequestInit;
        //     const resp = await fetch(MANIFEST_URL, init);
        //     if (!resp.ok) {
        //         responseFailure = "Http error getting manifest";
        //     } else {
        //         return resp.json();
        //     }
        // } catch {
        //     responseFailure = "Error getting manifest";
        // }

        // return Promise.reject(
        //     `Could not retrieve manifest. ${responseFailure}`
        // );
    }
}
