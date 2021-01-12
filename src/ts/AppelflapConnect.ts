/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { THttpMethods } from "ts/Types/CanoeEnums";
import {
    TPublication,
    TPublications,
    TPublicationTarget,
    TSubscription,
    TSubscriptions,
    TSubscriptionVersion,
} from "ts/Types/CacheTypes";

import { registerRoute } from "workbox-routing/registerRoute";
import { NetworkOnly } from "workbox-strategies/NetworkOnly";

export class AppelflapConnect {
    readonly localHostURI = "http://127.0.0.1";

    #portNo = -1;
    readonly metaApi = "meta";
    readonly cacheApi = "api/ingeblikt";
    readonly actionApi = "api/do";

    readonly insLock = "insertion-lock";
    readonly publications = "publications";
    readonly subscriptions = "subscriptions";
    readonly status = "status";
    readonly reboot = "reboot";

    constructor() {
        this.initialiseRoutes();
    }

    private _commands = {
        getMetaStatus: {
            commandPath: `${this.metaApi}/${this.status}`,
            method: "GET",
        },
        setLock: {
            commandPath: `${this.cacheApi}/${this.insLock}`,
            method: "PUT",
        },
        releaseLock: {
            commandPath: `${this.cacheApi}/${this.insLock}`,
            method: "DELETE",
        },
        getCacheStatus: {
            commandPath: `${this.cacheApi}/${this.status}`,
            method: "GET",
        },
        doReboot: {
            commandPath: `${this.actionApi}/${this.reboot}`,
            method: "POST",
        },
        getPublications: {
            commandPath: `${this.cacheApi}/${this.publications}`,
            method: "GET",
        },
        savePublication: {
            commandPath: `${this.cacheApi}/${this.publications}`,
            method: "PUT",
        },
        deletePublication: {
            commandPath: `${this.cacheApi}/${this.publications}`,
            method: "DELETE",
        },
        getSubscriptions: {
            commandPath: `${this.cacheApi}/${this.subscriptions}`,
            method: "GET",
        },
        subscribe: {
            commandPath: `${this.cacheApi}/${this.subscriptions}`,
            method: "PUT",
        },
        unsubscribe: {
            commandPath: `${this.cacheApi}/${this.subscriptions}`,
            method: "DELETE",
        },
        bulkSubscribe: {
            commandPath: `${this.cacheApi}/${this.subscriptions}`,
            method: "POST",
        },
    } as {
        [name: string]: { commandPath: string; method: THttpMethods };
    };

    /** Get the port number that Appelflap is using or return -1 */
    get portNo(): number {
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
        const requestInfo = `${this.localHostURI}:${this.portNo}/${commandPath}`;

        /** When we finally have authorization via Appelflap, we'll change this */
        const weHaveAuthorization = false;

        // Somewhere, some documentation says it is preferable to set requestInit to undefined
        // if all the values are defaults (e.g. `method: GET`), but I can't find it currently.
        const requestInitRequired = weHaveAuthorization || commandInit;

        const requestInit = !requestInitRequired
            ? undefined
            : commandInit || ({} as RequestInit);

        if (weHaveAuthorization) {
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
            switch (response.status) {
                case 400:
                case 401:
                case 404:
                case 409:
                case 503:
                    return Promise.reject(new Error(response.statusText));
            }

            // This is a response status that's not known
            return Promise.reject(new Error("Nope, that's not OK"));
        }

        switch (returnType) {
            case "json":
                return await response.json();
            case "text":
                return await response.text();
        }
    };

    private initialiseRoutes = (): void => {
        const portNo = this.portNo;
        Object.keys(this._commands).forEach((commandName) => {
            const command = this._commands[commandName];
            const route = `${this.localHostURI}:${portNo}/${command.commandPath}`;
            registerRoute(new RegExp(route), new NetworkOnly(), command.method);
        });
    };

    public getMetaStatus = async (): Promise<any> => {
        const { commandPath } = this._commands.getMetaStatus;
        return this.performCommand(commandPath);
    };

    public lock = async (): Promise<string> => {
        const { commandPath, method } = this._commands.setLock;
        return this.performCommand(commandPath, { method }, "text");
    };

    public unlock = async (): Promise<string> => {
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

    public getPublications = async (): Promise<TPublications> => {
        const { commandPath } = this._commands.getPublications;
        return this.performCommand(commandPath) as Promise<TPublications>;
    };

    private publicationPath = (publication: TPublicationTarget) => {
        const prepWebOrigin = encodeURIComponent(publication.webOrigin);
        const prepCacheName = encodeURIComponent(publication.cacheName);
        return `${prepWebOrigin}/${prepCacheName}`;
    };

    public publish = async (publication: TPublication): Promise<string> => {
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

    public unpublish = async (
        publication: TPublicationTarget
    ): Promise<string> => {
        const { commandPath, method } = this._commands.deletePublication;
        const requestPath = `${commandPath}/${this.publicationPath(
            publication
        )}`;

        return this.performCommand(requestPath, { method }, "text");
    };

    public getSubscriptions = async (): Promise<TSubscriptions> => {
        const { commandPath } = this._commands.getSubscriptions;

        return this.performCommand(commandPath) as Promise<TSubscriptions>;
    };

    /** Build the Version Min and Max headers.
     * This method 'assumes responsibility' for the values provided to it.
     * @param { TSubscription | TSubscriptionVersion } versionRange
     * - A subscription or subscriptionVersion that identifies none, either or both a version min and a version max value
     * @returns { Record<string, string> | undefined }
     * undefined if there were no version min or max values, otherwise a header with the relevant values
     * @throws { RangeError } If both a min and max are provided and they are incorrectly ordered
     */
    private buildVersionHeaders = (
        versionRange: TSubscription | TSubscriptionVersion
    ): Record<string, string> | undefined => {
        let min = -1;
        let max = -1;
        const hasMin = typeof versionRange.versionMin === "number";
        const hasMax = typeof versionRange.versionMax === "number";
        if (hasMin || hasMax) {
            if (
                hasMin &&
                hasMax &&
                versionRange.versionMin! > versionRange.versionMax!
            ) {
                throw new RangeError(
                    "versionMin must be less than or equal to versionMax"
                );
            }
            if (hasMin && versionRange.versionMin! > 0) {
                min = versionRange.versionMin!;
            }
            if (hasMax && versionRange.versionMax! > 0) {
                max = versionRange.versionMax!;
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

    public subscribe = async (subscription: TSubscription): Promise<string> => {
        const { commandPath, method } = this._commands.subscribe;
        const requestPath = `${commandPath}/${this.publicationPath(
            subscription
        )}`;
        const commandInit = { method: method } as RequestInit;
        const headers = this.buildVersionHeaders(subscription);
        if (headers) {
            commandInit.headers = headers;
        }

        return this.performCommand(requestPath, commandInit, "text");
    };

    public unsubscribe = async (
        publication: TPublicationTarget
    ): Promise<string> => {
        const { commandPath, method } = this._commands.unsubscribe;
        const requestPath = `${commandPath}/${this.publicationPath(
            publication
        )}`;

        return this.performCommand(requestPath, { method }, "text");
    };

    public bulkSubscribe = async (
        subscriptions: TSubscriptions
    ): Promise<string> => {
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