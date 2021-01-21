/* eslint-disable @typescript-eslint/no-empty-function */
import { CanoeHost } from "./CanoeHost";
import { CertChain } from "./CertChain";

/** Global canoeHost */
declare global {
    let canoeHost: CanoeHost;
    let certChain: CertChain;
}

/** Initialise the CanoeHost (a wrapper around Appelflap)
 * @param { function } startup - an optional void returning function that is performed after the attempt to start Appelflap.
 */
export const InitialiseCanoeHost = async (
    startup: () => void = () => {}
): Promise<string> => {
    try {
        canoeHost = new CanoeHost();
        await canoeHost.StartCanoe(startup);
        return await Promise.resolve("");
    } catch (e) {
        return await Promise.resolve(
            "Appelflap apparently running, but could not achieve 'lock' for Canoe"
        );
    }
};

/** Initialise the certificate chain, this should only work if:
 * - Canoe is hosted in Appelflap
 * - The user is logged in
 * - The user has the correct permissions to publish
 */
export const InitialiseCertChain = async (): Promise<void> => {
    if (!canoeHost) {
        return;
    }

    const afc = canoeHost.appelflapConnect;

    if (afc && !certChain) {
        try {
            certChain = new CertChain(afc);
            const hasCert = await certChain.initialise();
            const packageCert = certChain.packageCertificate;
        } catch (e) {
            // No signed cert - change this to a proper message, if that is appropriate
            console.info(e);
        }
    }
};
