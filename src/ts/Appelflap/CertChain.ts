import { TCertificate } from "../Types/CacheTypes";

import Logger from "../Logger";
import { AppelflapConnect } from "./AppelflapConnect";
import { AF_CERTCHAIN_LENGTH_HEADER } from "./AppelflapRouting";

// See ts/Typings for the type definitions for these imports
import { BACKEND_BASE_URL } from "js/urls";
import { isAuthenticated } from "ReduxImpl/Interface";

const logger = new Logger("CertChain");
const appelflapPKIsign = `${BACKEND_BASE_URL}/appelflap_PKI/sign-cert`;

export type TCertState = "undefined" | "unsigned" | "signed";

export class CertChain {
    //#region Implement as Singleton
    static instance: CertChain;
    #packageCert?: TCertificate;
    #lastError: string;

    private constructor() {
        this.#lastError = "";
        logger.log("Singleton created");
    }

    /** Gets the single instance of CertChain */
    public static get Instance(): CertChain {
        if (!CertChain.instance) {
            CertChain.instance = new CertChain();
        }

        return CertChain.instance;
    }
    //#endregion

    get packageCertificate(): TCertificate | undefined {
        return this.#packageCert;
    }

    get lastError(): string {
        return this.#lastError;
    }

    get certState(): TCertState {
        return !this.#packageCert
            ? "undefined"
            : this.#packageCert.isCertSigned
            ? "signed"
            : "unsigned";
    }

    async initialise(): Promise<boolean> {
        logger.info("Initialise");

        if (isAuthenticated()) {
            await this.createCertChain();
        } else {
            // Purge signed cert
            await this.DeletePackageCertificateFromAppelflap();
            this.#packageCert = undefined;
            logger.info("User no longer authenticated");
        }

        logger.info(
            `Initialisation completed, package publishing certificate is ${this.certState}`
        );

        return this.certState === "signed";
    }

    private async createCertChain(): Promise<void> {
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
    }

    /** GET the (unsigned) package publishing certificate from Appelflap */
    private async GetPackageCertificateFromAppelflap(): Promise<
        TCertificate | undefined
    > {
        if (AppelflapConnect.Instance) {
            return await AppelflapConnect.Instance.getCertificate();
        }
        return undefined;
    }

    private async DeletePackageCertificateFromAppelflap(): Promise<string> {
        if (AppelflapConnect.Instance) {
            return await AppelflapConnect.Instance.deleteCertificate();
        }
        return "";
    }

    /** POST the package publishing certificate to the backend for signing */
    private async PostPackageCertificateForSigning(): Promise<string> {
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
            const response = await fetch(appelflapPKIsign, init);

            if (!response.ok) {
                this.#lastError =
                    "Http error getting package publishing certificate signed";
            } else {
                const decodedCertificate = await response.text();
                const certHeader = response.headers.get(
                    AF_CERTCHAIN_LENGTH_HEADER
                );
                let isCertSigned = false;
                if (!certHeader) {
                    // This is a simplistic examination of the cert to establish that it is signed
                    // Appelflap checks the certificate chain explicitly
                    const certsFound =
                        decodedCertificate.match(/-END CERTIFICATE-/g) || [];
                    isCertSigned = certsFound.length === 3;
                } else {
                    isCertSigned = certHeader === "3";
                }
                this.#packageCert = {
                    cert: decodedCertificate,
                    isCertSigned,
                } as TCertificate;

                this.#lastError = "";
                logger.info(
                    "Package publishing certificate signed successfully"
                );
            }
        } catch (e) {
            this.#lastError = `Error getting package publishing certificate signed\n${e}`;
        }

        return this.#lastError;
    }

    /** POST the signed package publishing certificate back to Appelflap */
    private async PostPackageCertificateToAppelflap(): Promise<string> {
        return AppelflapConnect.Instance && this.#packageCert
            ? await AppelflapConnect.Instance.saveCertificate(this.#packageCert)
            : "";
    }
}
