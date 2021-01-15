// Canoe should
// 1. display data if it has it
// 2. display data quickly as possible ( even if old )
// 3. try to fetch data if it has to ( display something while it does )
// 4. not care if you are not logged in, if the data is present

import { IManifest } from "./Interfaces/IManifest";
import { resolveManifest } from "./Container";
import { LoadingCallback, RenderCallback } from "./Callbacks";

/**  To be called on every navigation
 Params:
  @locationHash the window.location.hash 
  @languageCode the active language code
  @loadingCallback called when asyncronsous operations are happening
  @renderCallback called when the data is available

 Responsibilities:
  - get the required data for page rendering either from the state, or the cache  
  - while doing anything asyncronous, communicate that the caller should display loading
  - if anything catastrophic happens, throw an exception to be handled by the caller
  - else communicate to the caller that it can render providing required data */
export async function getDataAndRender(
    locationHash: string,
    languageCode: string,
    loadingCallback: LoadingCallback,
    renderCallback: RenderCallback
): Promise<void> {
    // try to get the manifest
    const manifest: IManifest = resolveManifest();

    // we have a manifest so let's find out what data we need
    const pageData: Record<string, unknown> = manifest.getPageData(
        locationHash,
        languageCode,
        loadingCallback
    );

    // render with the required resource data
    renderCallback(pageData);
}