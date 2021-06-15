/* eslint-disable @typescript-eslint/no-empty-function */
import { BeroHost } from "./BeroHost";
import { CertChain } from "./CertChain";
import Logger from "../Logger";

const logger = new Logger("StartUp");

/** Initialise the BeroHost (a wrapper around Appelflap)
 * @param { function } startup - an optional void returning function that is performed after the attempt to start Appelflap.
 */
export const InitialiseBeroHost = async (
    startup: () => void = () => {}
): Promise<string> => {
    try {
        const gt = globalThis as Record<string, any>;
        gt.beroHost = new BeroHost();
        await gt.beroHost.StartBero(startup);
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
 * - Bero is hosted in Appelflap
 * - The user is logged in
 * - The user has the correct permissions to publish
 */
export const initialiseCertChain = async (): Promise<void> => {
    const gt = globalThis as Record<string, any>;
    if (!gt.beroHost || gt.certChain) {
        return;
    }

    const afc = gt.beroHost.appelflapConnect;

    if (afc && !gt.certChain) {
        try {
            gt.certChain = new CertChain(afc);
            const hasCert = await (gt.certChain as CertChain).initialise();
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
    }
};
