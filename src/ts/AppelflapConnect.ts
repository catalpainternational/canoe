export class AppelflapConnect {
    private _localHostURI = "http://127.0.0.1";
    private _portNo = -1;

    /** Get the port number that Appelflap is using or return -1 */
    public getPortNo(): number {
        // Appelflap knows the port number (which is randomly picked at launch); and it needs to let the web context know what the port number is.
        // It could be learned via a call to a contentscript (WebExtension), but that won't work in a ServiceWorker. Hence, we stuff it in the language
        // tags, which are available inside a ServiceWorker context.
        // This is not a security measure or anything — it's just that we can't use a statically defined port, because we simply don't know whether
        // it won't already be occupied. Similarly the charcode shifting is not obfuscation, it's just that Geckoview is picky about what we pass
        // as a language tag.

        if (this._portNo > -1) {
            return this._portNo;
        }

        const portword = navigator.languages.filter((word) =>
            /^ep-[a-j]{4,5}$/.test(word)
        )[0];

        this._portNo = !portword
            ? -1
            : parseInt(
                  portword
                      .split("")
                      .slice(3)
                      .map((el) => String.fromCharCode(el.charCodeAt(0) - 0x31))
                      .join(""),
                  10
              );

        return this._portNo;
    }

    private appelflapFetch = async (
        commandPath: string,
        method = "GET",
        requestPath = ""
    ): Promise<Response> => {
        let requestInfo = `${
            this._localHostURI
        }:${this.getPortNo()}/${commandPath}`;
        if (requestPath) {
            requestInfo = `${requestInfo}/${requestPath}`;
        }

        const requestInit =
            method !== "GET" ? ({ method: method } as RequestInit) : undefined;

        return await fetch(requestInfo, requestInit);
    };

    public getMeta = async (): Promise<any> => {
        const response = await this.appelflapFetch("meta/status");

        if (!response.ok) {
            return "Nope, that's not OK";
        }

        const pagesResponseJSON = await response.json();

        return pagesResponseJSON;
    };
}
