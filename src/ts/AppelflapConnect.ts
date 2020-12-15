export class AppelflapConnect {
    private _localHostURI = "http://127.0.0.1";

    private _portNo = -1;
    private _metaApi = "meta";
    private _cacheApi = "api/ingeblikt";
    private _actionApi = "do";

    private _lock = "insertion-lock";
    private _publications = "publications";
    private _subscriptions = "subscriptions";
    private _status = "status";
    private _reboot = "reboot";

    private _commands = {
        getMetaStatus: {
            commandPath: `${this._metaApi}/${this._status}`,
            method: "GET",
        },
        setLock: {
            commandPath: `${this._cacheApi}/${this._lock}`,
            method: "PUT",
        },
        releaseLock: {
            commandPath: `${this._cacheApi}/${this._lock}`,
            method: "DELETE",
        },
        getCacheStatus: {
            commandPath: `${this._cacheApi}/${this._status}`,
            method: "GET",
        },
        doReboot: {
            commandPath: `${this._actionApi}/${this._reboot}`,
            method: "POST",
        },
        getPublications: {
            commandPath: `${this._cacheApi}/${this._publications}`,
            method: "GET",
        },
        savePublication: {
            commandPath: `${this._cacheApi}/${this._publications}`,
            method: "PUT",
        },
        deletePublication: {
            commandPath: `${this._cacheApi}/${this._publications}`,
            method: "DELETE",
        },
        getSubscriptions: {
            commandPath: `${this._cacheApi}/${this._subscriptions}`,
            method: "GET",
        },
        subscribe: {
            commandPath: `${this._cacheApi}/${this._subscriptions}`,
            method: "PUT",
        },
        unsubscribe: {
            commandPath: `${this._cacheApi}/${this._subscriptions}`,
            method: "DELETE",
        },
        bulkSubscribe: {
            commandPath: `${this._cacheApi}/${this._subscriptions}`,
            method: "POST",
        },
    } as {
        [name: string]: { commandPath: string; method: THttpMethods };
    };

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
        commandInit?: RequestInit
    ): Promise<Response> => {
        const requestInfo = `${
            this._localHostURI
        }:${this.getPortNo()}/${commandPath}`;

        const weHazAuthorization = false;

        const requestInit =
            !weHazAuthorization ||
            !commandInit ||
            JSON.stringify(commandInit) == '{"method":"GET"}'
                ? undefined
                : commandInit
                ? commandInit
                : ({} as RequestInit);

        if (weHazAuthorization) {
            // Add the authorization header
        }

        return await fetch(requestInfo, requestInit);
    };

    private performCommand = async (
        commandPath: string,
        commandInit?: RequestInit,
        returnType: "json" | "text" = "json"
    ): Promise<any> => {
        const response = await this.appelflapFetch(commandPath, commandInit);

        if (!response.ok) {
            return "Nope, that's not OK";
        }

        switch (returnType) {
            case "json":
                return await response.json();
            case "text":
                return await response.text();
        }
    };

    public getMetaStatus = async (): Promise<any> => {
        const { commandPath } = this._commands.getMetaStatus;
        return this.performCommand(commandPath);
    };

    public setLock = async (): Promise<any> => {
        const { commandPath, method } = this._commands.setLock;
        return this.performCommand(commandPath, { method }, "text");
    };

    public releaseLock = async (): Promise<any> => {
        const { commandPath, method } = this._commands.releaseLock;
        return this.performCommand(commandPath, { method }, "text");
    };

    public getCacheStatus = async (): Promise<any> => {
        const { commandPath } = this._commands.getCacheStatus;
        return this.performCommand(commandPath);
    };

    public doReboot = async (): Promise<any> => {
        const { commandPath, method } = this._commands.doReboot;
        return this.performCommand(commandPath, { method }, "text");
    };

    public getPublications = async (): Promise<any> => {
        const { commandPath } = this._commands.getPublications;
        return this.performCommand(commandPath);
    };

    private publicationPath = (webOrigin: string, cacheName: string) => {
        const prepWebOrigin = encodeURIComponent(webOrigin);
        const prepCacheName = encodeURIComponent(cacheName);
        return `${prepWebOrigin}/${prepCacheName}`;
    };

    public savePublication = async (
        webOrigin: string,
        cacheName: string,
        version: number
    ): Promise<any> => {
        const { commandPath, method } = this._commands.savePublication;
        const requestPath = `${commandPath}/${this.publicationPath(
            webOrigin,
            cacheName
        )}`;
        const commandInit = {
            method: method,
            headers: { "version-number": version.toString() },
        };

        return this.performCommand(requestPath, commandInit, "text");
    };

    public deletePublication = async (
        webOrigin: string,
        cacheName: string
    ): Promise<any> => {
        const { commandPath, method } = this._commands.deletePublication;
        const requestPath = `${commandPath}/${this.publicationPath(
            webOrigin,
            cacheName
        )}`;

        return this.performCommand(requestPath, { method }, "text");
    };

    public getSubscriptions = async (): Promise<any> => {
        const { commandPath } = this._commands.getSubscriptions;

        return this.performCommand(commandPath);
    };

    /** Set up the Version Min and Max headers */
    private setVersionHeaders = (
        versionMin?: number,
        versionMax?: number
    ): Record<string, string> | undefined => {
        let min = -1;
        let max = -1;
        if (versionMin || versionMax) {
            if (versionMin && versionMax && versionMin > versionMax) {
                const tempVersion = versionMin;
                versionMin = versionMax;
                versionMax = tempVersion;
            }
            if (versionMin && versionMin > 0) {
                min = versionMin;
            }
            if (versionMax && versionMax > 0) {
                max = versionMax;
            }
        }
        if (min > -1 || max > -1) {
            const headers: Record<string, string> = {};
            if (min > -1) {
                headers["Version-Min"] = min.toString();
            }
            if (max > -1) {
                headers["Version-Max"] = max.toString();
            }
            return headers;
        }

        return undefined;
    };

    public subscribe = async (
        webOrigin: string,
        cacheName: string,
        versionMin?: number,
        versionMax?: number
    ): Promise<any> => {
        const { commandPath, method } = this._commands.subscribe;
        const requestPath = `${commandPath}/${this.publicationPath(
            webOrigin,
            cacheName
        )}`;
        const commandInit = { method: method } as RequestInit;
        const headers = this.setVersionHeaders(versionMin, versionMax);
        if (headers) {
            commandInit.headers = headers;
        }

        return this.performCommand(requestPath, commandInit, "text");
    };

    public unsubscribe = async (
        webOrigin: string,
        cacheName: string
    ): Promise<any> => {
        const { commandPath, method } = this._commands.unsubscribe;
        const requestPath = `${commandPath}/${this.publicationPath(
            webOrigin,
            cacheName
        )}`;

        return this.performCommand(requestPath, { method }, "text");
    };

    public bulkSubscribe = async (
        webOrigin: string,
        cacheName: string,
        subscriptions: {
            [name: string]: {
                [name: string]: {
                    "Version-Min": number;
                    "Version-Max": number;
                };
            };
        }
    ): Promise<any> => {
        const { commandPath, method } = this._commands.bulkSubscribe;
        const requestPath = `${commandPath}/${this.publicationPath(
            webOrigin,
            cacheName
        )}`;
        const commandInit = {
            method: method,
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify(subscriptions),
        };

        return this.performCommand(requestPath, commandInit, "text");
    };
}
