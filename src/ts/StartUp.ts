/* eslint-disable @typescript-eslint/no-empty-function */
import { CanoeHost } from "ts/CanoeHost";
import { CertChain } from "ts/CertChain";

/** Initialise the CanoeHost (a wrapper around Appelflap)
 * @param { function } startup - an optional void returning function that is performed after the attempt to start Appelflap.
 */
export const InitialiseCanoeHost = async (
    startup: () => void = () => {}
): Promise<string> => {
    try {
        const gt = globalThis as Record<string, any>;
        gt.canoeHost = new CanoeHost();
        await gt.canoeHost.StartCanoe(startup);
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
    const gt = globalThis as Record<string, any>;
    if (!gt.canoeHost) {
        return;
    }

    const afc = gt.canoeHost.appelflapConnect;

    if (afc && !gt.certChain) {
        try {
            gt.certChain = new CertChain(afc);
            const hasCert = await (gt.certChain as CertChain).initialise();
            if (!hasCert) {
                throw new Error(
                    "Publishing certificate chain could not be initialised. \
                    The certificate endpoint may not be working, \
                    Canoe is not running within Appelflap (the mobile host), \
                    the user is not logged in \
                    or the user may not have the correct permissions."
                );
            }
        } catch (e) {
            // No signed cert - change this to a proper message, if that is appropriate
            console.info(e);
        }
    }
};
