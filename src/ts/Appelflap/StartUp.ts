/* eslint-disable @typescript-eslint/no-empty-function */
import { AppelflapConnect } from "./AppelflapConnect";
import { BeroHost } from "./BeroHost";
import { CertChain } from "./CertChain";
import Logger from "../Logger";

// See ts/Typings for the type definitions for these imports
import { isAuthenticated } from "ReduxImpl/Interface";

const logger = new Logger("StartUp");

/** Initialise the BeroHost (a wrapper around Appelflap)
 * @param { function } startup - an optional void returning function that is performed after the attempt to start Appelflap.
 */
export const InitialiseBeroHost = async (
    startup: () => void = () => {}
): Promise<string> => {
    try {
        await BeroHost.Instance.StartBero(startup);
        logger.info("BeroHost initialised");
        return await Promise.resolve("");
    } catch (e) {
        logger.info("BeroHost not initialised, could not achieve 'lock'");
        return await Promise.resolve(
            "Appelflap apparently running, but could not achieve 'lock' for Bero"
        );
    }
};

/** Initialise the certificate chain, this should only work if:
 * - Bero is hosted in Appelflap (test the Appelflap.Instance exists)
 * - The user is logged in
 * - The user has the correct permissions to publish
 */
export const initialiseCertChain = async (): Promise<void> => {
    const haveAFC = AppelflapConnect.Instance;
    const haveSignedCert = CertChain.Instance.certState === "signed";
    if (!haveAFC || (haveSignedCert && isAuthenticated())) {
        // We're not hosted in Appelflap,
        // or we have a signed certificate and the user is authenticated
        return;
    }

    try {
        const hasCert = await CertChain.Instance.initialise();
        if (!hasCert) {
            throw new Error(
                "Publishing certificate chain could not be initialised. \
                The certificate endpoint may not be working, \
                Bero is not running within Appelflap (the mobile host), \
                the user is not logged in \
                or the user may not have the correct permissions."
            );
        }
        logger.info("CertChain initialised");
    } catch (e) {
        // No signed cert - change this to a proper message, if that is appropriate
        logger.info("CertChain not initialised");
    }
};
