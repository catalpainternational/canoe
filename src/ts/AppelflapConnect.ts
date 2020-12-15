import { THttpMethods } from "ts/Types/CanoeEnums";
import {
    TPublication,
    TPublicationTarget,
    TSubscription,
    TSubscriptions,
    TSubscriptionVersion,
} from "ts/Types/CacheTypes";

export class AppelflapConnect {
    #localHostURI = "http://127.0.0.1";

    #portNo = -1;
    #metaApi = "meta";
    #cacheApi = "api/ingeblikt";
    #actionApi = "do";

    #lock = "insertion-lock";
    #publications = "publications";
    #subscriptions = "subscriptions";
    #status = "status";
    #reboot = "reboot";

    private _commands = {
        getMetaStatus: {
            commandPath: `${this.#metaApi}/${this.#status}`,
            method: "GET",
        },
        setLock: {
            commandPath: `${this.#cacheApi}/${this.#lock}`,
            method: "PUT",
        },
        releaseLock: {
            commandPath: `${this.#cacheApi}/${this.#lock}`,
            method: "DELETE",
        },
        getCacheStatus: {
            commandPath: `${this.#cacheApi}/${this.#status}`,
            method: "GET",
        },
        doReboot: {
            commandPath: `${this.#actionApi}/${this.#reboot}`,
            method: "POST",
        },
        getPublications: {
            commandPath: `${this.#cacheApi}/${this.#publications}`,
            method: "GET",
        },
        savePublication: {
            commandPath: `${this.#cacheApi}/${this.#publications}`,
            method: "PUT",
        },
        deletePublication: {
            commandPath: `${this.#cacheApi}/${this.#publications}`,
            method: "DELETE",
        },
        getSubscriptions: {
            commandPath: `${this.#cacheApi}/${this.#subscriptions}`,
            method: "GET",
        },
        subscribe: {
            commandPath: `${this.#cacheApi}/${this.#subscriptions}`,
            method: "PUT",
        },
        unsubscribe: {
            commandPath: `${this.#cacheApi}/${this.#subscriptions}`,
            method: "DELETE",
        },
        bulkSubscribe: {
            commandPath: `${this.#cacheApi}/${this.#subscriptions}`,
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

        if (this.#portNo > -1) {
            return this.#portNo;
        }

        const portword = navigator.languages.filter((word) =>
            /^ep-[a-j]{4,5}$/.test(word)
        )[0];

        if (!portword) {
            this.#portNo = -1;
            return this.#portNo;
        }

        const portNo = [...portword.substr(3)]
            .map((el) => String.fromCharCode(el.charCodeAt(0) - 0x31))
            .join("");

        this.#portNo = parseInt(portNo, 10);

        return this.#portNo;
    }

    private appelflapFetch = async (
        commandPath: string,
        commandInit?: RequestInit
    ): Promise<Response> => {
        const requestInfo = `${
            this.#localHostURI
        }:${this.getPortNo()}/${commandPath}`;

        /** When we finally have authorization via Appelflap, we'll change this */
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

    private publicationPath = (publication: TPublicationTarget) => {
        const prepWebOrigin = encodeURIComponent(publication.webOrigin);
        const prepCacheName = encodeURIComponent(publication.cacheName);
        return `${prepWebOrigin}/${prepCacheName}`;
    };

    public savePublication = async (
        publication: TPublication
    ): Promise<any> => {
        const { commandPath, method } = this._commands.savePublication;
        const requestPath = `${commandPath}/${this.publicationPath(
            publication
        )}`;
        const commandInit = {
            method: method,
            headers: { "version-number": publication.version.toString() },
        };

        return this.performCommand(requestPath, commandInit, "text");
    };

    public deletePublication = async (
        publication: TPublicationTarget
    ): Promise<any> => {
        const { commandPath, method } = this._commands.deletePublication;
        const requestPath = `${commandPath}/${this.publicationPath(
            publication
        )}`;

        return this.performCommand(requestPath, { method }, "text");
    };

    public getSubscriptions = async (): Promise<any> => {
        const { commandPath } = this._commands.getSubscriptions;

        return this.performCommand(commandPath);
    };

    /** Set up the Version Min and Max headers */
    private setVersionHeaders = (
        versionRange: TSubscription | TSubscriptionVersion
    ): Record<string, string> | undefined => {
        let min = -1;
        let max = -1;
        if (versionRange["Version-Min"] || versionRange["Version-Max"]) {
            if (
                versionRange["Version-Min"] &&
                versionRange["Version-Max"] &&
                versionRange["Version-Min"] > versionRange["Version-Max"]
            ) {
                const tempVersion = versionRange["Version-Min"];
                versionRange["Version-Min"] = versionRange["Version-Max"];
                versionRange["Version-Max"] = tempVersion;
            }
            if (
                versionRange["Version-Min"] &&
                versionRange["Version-Min"] > 0
            ) {
                min = versionRange["Version-Min"];
            }
            if (
                versionRange["Version-Max"] &&
                versionRange["Version-Max"] > 0
            ) {
                max = versionRange["Version-Max"];
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

    public subscribe = async (subscription: TSubscription): Promise<any> => {
        const { commandPath, method } = this._commands.subscribe;
        const requestPath = `${commandPath}/${this.publicationPath(
            subscription
        )}`;
        const commandInit = { method: method } as RequestInit;
        const headers = this.setVersionHeaders(subscription);
        if (headers) {
            commandInit.headers = headers;
        }

        return this.performCommand(requestPath, commandInit, "text");
    };

    public unsubscribe = async (
        publication: TPublicationTarget
    ): Promise<any> => {
        const { commandPath, method } = this._commands.unsubscribe;
        const requestPath = `${commandPath}/${this.publicationPath(
            publication
        )}`;

        return this.performCommand(requestPath, { method }, "text");
    };

    public bulkSubscribe = async (
        subscriptions: TSubscriptions
    ): Promise<any> => {
        const { commandPath, method } = this._commands.bulkSubscribe;
        const requestPath = `${commandPath}`;
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
