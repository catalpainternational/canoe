import { TCertificate } from "./Types/CacheTypes";

import { AppelflapConnect } from "./AppelflapConnect";

import { getAuthenticationToken } from "js/AuthenticationUtilities";
import { ROUTES_FOR_REGISTRATION } from "js/urls";

export class CertChain {
    #afc?: AppelflapConnect;
    #packageCert?: TCertificate;
    #lastError: string;

    constructor(afc: AppelflapConnect) {
        this.#afc = afc;
        this.#lastError = "";
    }

    get packageCertificate(): TCertificate | undefined {
        return this.#packageCert;
    }

    get lastError(): string {
        return this.#lastError;
    }

    async initialise(): Promise<boolean> {
        try {
            this.#packageCert = await this.GetPackageCertificateFromAppelflap();
            if (!this.#packageCert?.isCertSigned) {
                const lastError = await this.PostPackageCertificateForSigning();
                if (!lastError && this.#packageCert) {
                    const result =
                        await this.PostPackageCertificateToAppelflap();
                    if (!result) {
                        this.#packageCert =
                            await this.GetPackageCertificateFromAppelflap();
                    }
                }
            }
        } catch (e) {
            // No signed cert
            this.#lastError = e;
            this.#packageCert = undefined;
        }
        return !!this.#packageCert;
    }

    private GetPackageCertificateFromAppelflap = async (): Promise<
        TCertificate | undefined
    > => {
        return this.#afc ? await this.#afc.getCertificate() : undefined;
    };

    private PostPackageCertificateForSigning = async (): Promise<string> => {
        if (!this.#packageCert || this.#packageCert.isCertSigned) {
            this.#lastError = this.#packageCert
                ? "No action taken: package publishing certificate already signed"
                : "No action taken: no unsigned package publishing certificate available (no Appelflap)";
            return this.#lastError;
        }

        try {
            const init = {
                method: "POST",
                headers: {
                    "content-type": "application/x-pem-file",
                    Authorization: `JWT ${getAuthenticationToken()}`,
                },
                body: this.#packageCert?.cert,
            } as RequestInit;
            const resp = await fetch(
                ROUTES_FOR_REGISTRATION.appelflapPKIsign,
                init
            );
            if (!resp.ok) {
                this.#lastError =
                    "Http error getting package publishing certificate signed";
            } else {
                const rawCert = await resp.text();

                this.#packageCert = {
                    cert: rawCert,
                    isCertSigned: false,
                };
                this.#lastError = "";
            }
        } catch (e) {
            this.#lastError = `Error getting package publishing certificate signed\n${e}`;
        }

        return this.#lastError;
    };

    private PostPackageCertificateToAppelflap = async (): Promise<string> => {
        return this.#afc && this.#packageCert
            ? await this.#afc.saveCertificate(this.#packageCert)
            : "";
    };
}
