import { TCertificate } from "./Types/CacheTypes";

import Logger from "./Logger";
import { AppelflapConnect } from "./AppelflapConnect";

import { ROUTES_FOR_REGISTRATION } from "js/urls";

const logger = new Logger("CertChain");

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

    get certState(): string {
        return !this.#packageCert
            ? "undefined"
            : this.#packageCert.isCertSigned
            ? "signed"
            : "unsigned";
    }

    async initialise(): Promise<boolean> {
        logger.info("Initialise");
        try {
            this.#packageCert = await this.GetPackageCertificateFromAppelflap();
            logger.info(`Package publishing certificate is ${this.certState}`);
            if (this.certState === "unsigned") {
                const lastError = await this.PostPackageCertificateForSigning();
                if (lastError) {
                    if (lastError.startsWith("No action taken:")) {
                        logger.warn(lastError);
                    } else {
                        logger.error(this.#lastError);
                    }
                }
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

        logger.info(
            `Initialisation completed, package publishing certificate is ${this.certState}`
        );

        return this.certState === "signed";
    }

    private GetPackageCertificateFromAppelflap = async (): Promise<
        TCertificate | undefined
    > => {
        return this.#afc ? await this.#afc.getCertificate() : undefined;
    };

    private PostPackageCertificateForSigning = async (): Promise<string> => {
        switch (this.certState) {
            case "undefined":
                return "No action taken: no unsigned package publishing certificate available (no Appelflap)";
            case "signed":
                return "No action taken: package publishing certificate already signed";
        }

        try {
            const init = {
                method: "POST",
                headers: {
                    "content-type": "application/x-pem-file",
                },
                credentials: "include",
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
                logger.info(
                    "Package publishing certificate signed successfully"
                );
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
