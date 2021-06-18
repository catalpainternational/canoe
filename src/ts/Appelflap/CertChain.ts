import { TCertificate } from "../Types/CacheTypes";

import Logger from "../Logger";
import { AppelflapConnect } from "./AppelflapConnect";

// See ts/Typings for the type definitions for these imports
import { BACKEND_BASE_URL } from "js/urls";

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
        try {
            this.#packageCert = await this.GetPackageCertificateFromAppelflap();
            logger.info(`Package publishing certificate is ${this.certState}`);
            if (this.certState === "undefined") {
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
        if (AppelflapConnect.Instance) {
            return await AppelflapConnect.Instance.getCertificate();
        }
        return undefined;
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
            const resp = await fetch(appelflapPKIsign, init);

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
        return AppelflapConnect.Instance && this.#packageCert
            ? await AppelflapConnect.Instance.saveCertificate(this.#packageCert)
            : "";
    };
}
