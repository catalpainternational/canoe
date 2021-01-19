import jseu from "js-encoding-utils";

import { getAuthenticationToken } from "js/AuthenticationUtilities";
import { ROUTES_FOR_REGISTRATION } from "js/urls";
import { AppelflapConnect } from "ts/AppelflapConnect";
import { TCertificate } from "./Types/CacheTypes";

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

    private PostPackageCertificateForSigning = async (): Promise<void> => {
        if (!this.#packageCert || this.#packageCert.isCertSigned) {
            this.#lastError = this.#packageCert
                ? "No action taken: package publishing certificate already signed"
                : "No action taken: no unsigned package publishing certificate available (no Appelflap)";
            return;
        }

        const cert = btoa(this.#packageCert?.cert || "");
        const derCert = jseu.formatter.pemToBin(cert);

        try {
            const init = {
                method: "POST",
                headers: {
                    "content-type": "application/octet-stream",
                    Authorization: `JWT ${getAuthenticationToken()}`,
                },
                body: derCert,
            } as RequestInit;
            const resp = await fetch(
                ROUTES_FOR_REGISTRATION.appelflapPKIsign,
                init
            );
            if (!resp.ok) {
                this.#lastError =
                    "Http error getting package publishing certificate signed";
            } else {
                this.#packageCert = {
                    cert: await resp.text(),
                    isCertSigned: true,
                };
                this.#lastError = "";
            }
        } catch {
            this.#lastError =
                "Error getting package publishing certificate signed";
        }

        return;
    };
}
