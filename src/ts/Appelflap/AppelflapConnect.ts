/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
    TCertificate,
    TPublication,
    TSubscriptions,
} from "../Types/CacheTypes";
import { TBundles } from "../Types/BundleTypes";

/* eslint-disable prettier/prettier */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: For when the unit tests cannot find the declaration file
import { AF_CERTCHAIN_LENGTH_HEADER, AF_LOCALHOSTURI, APPELFLAPCOMMANDS } from "./AppelflapRouting";
// The above import statement MUST all appear on the one line for the @ts-ignore to work
/* eslint-enable prettier/prettier */

import Logger from "../Logger";
import { inAppelflap } from "../PlatformDetection";
import {
    TInfoStorage,
    TInfoWiFi,
    TPeerProperties,
    TPeers,
} from "../Types/InfoTypes";

const logger = new Logger("AppelflapConnect");

export class AppelflapConnect {
    //#region Implement as Singleton
    static instance?: AppelflapConnect;
    #endpointProperties?: {
        username: string;
        password: string;
        port: number;
    };
    #peerProperties?: TPeerProperties;

    private constructor() {
        logger.log("Singleton created");
    }

    /**
     * Gets the single instance of AppelflapConnect
     * or undefined if we're not inAppelflap
     */
    public static getInstance(): AppelflapConnect | undefined {
        if (!AppelflapConnect.instance) {
            const gt = globalThis as Record<string, any>;
            gt["AFC_MOCKMODE"] = gt["AFC_MOCKMODE"] || false;

            if (!gt["AFC_MOCKMODE"]) {
                AppelflapConnect.instance = inAppelflap()
                    ? new AppelflapConnect()
                    : undefined;
            } else {
                // Return a 'mock' of AppelflapConnect
                // to be used only in testing
                AppelflapConnect.instance = new AppelflapConnect();
            }
        }

        return AppelflapConnect.instance;
    }
    //#endregion

    /** Get the Authorisation Header details that Appelflap requires
     * @remarks See: https://github.com/catalpainternational/appelflap/blob/12ab990462012a50e73956e17d2006b425678eae/docs/API/determining-endpoint.md for more info
     * @returns The auth header as `Basic btoaEncodedStuff` or 'None' if the credentials are not available
     */
    private get authHeader(): string {
        if (!this.#endpointProperties) {
            return "None";
        }

        const creds = `${this.#endpointProperties.username}:${
            this.#endpointProperties.password
        }`;
        return `Basic ${btoa(creds)}`;
    }

    private appelflapFetch = async (
        commandPath: string,
        commandInit?: RequestInit
    ): Promise<Response> => {
        const requestInfo = `${AF_LOCALHOSTURI}:${
            this.#endpointProperties!.port
        }/${commandPath}`;

        const authorization = this.authHeader;
        const weHaveAuthorization = authorization !== "None";

        // Somewhere, some documentation says it is preferable to set requestInit to undefined
        // if all the values are defaults (e.g. `method: GET`), but I can't find it currently.
        const requestInitRequired = weHaveAuthorization || commandInit;

        const requestInit = !requestInitRequired
            ? undefined
            : commandInit || ({} as RequestInit);

        if (weHaveAuthorization) {
            // Add the authorization header
            const newHeaders: any = requestInit!.headers || {};
            newHeaders["Authorization"] = authorization;
            requestInit!.headers = newHeaders;
        }

        return await fetch(requestInfo, requestInit);
    };

    private performCommand = async (
        commandPath: string,
        commandInit?: RequestInit,
        returnType: "json" | "text" | "pem" = "json"
    ): Promise<any> => {
        await this.getEndpointProperties();
        if (!this.#endpointProperties) {
            return Promise.reject(
                new Error("No Appelflap endpoint properties")
            );
        }

        const response = await this.appelflapFetch(commandPath, commandInit);

        if (!response.ok) {
            switch (response.status) {
                case 400:
                case 401:
                case 404:
                case 409:
                case 500:
                case 503:
                    return Promise.reject(new Error(response.statusText));
            }

            // This is a response status that's not known
            return Promise.reject(new Error("Nope, that's not OK"));
        }

        /* eslint-disable no-case-declarations */
        switch (returnType) {
            case "json":
                return await response.json();
            case "text":
                const testResult = await response.text();
                return testResult || response.statusText;
            case "pem":
                // A `application/x-pem-file` is actually a sub-type of `text`
                // But we need to include a little extra info from the repsonse header.
                // So we'll actually return it as an object (i.e. json)
                const encodedCertificate = await response.text();
                const isCertSigned =
                    response.headers.get(AF_CERTCHAIN_LENGTH_HEADER) === "3";
                const cert = {
                    cert: encodedCertificate,
                    isCertSigned: isCertSigned,
                } as TCertificate;

                return cert;
        }
        /* eslint-enable no-case-declarations */
    };

    //#region Appelflap Administration
    private getEndpointProperties = async (): Promise<void> => {
        if (!this.#endpointProperties) {
            const { commandPath } = APPELFLAPCOMMANDS.getEndpointProperties;
            logger.info(`Getting endpoint properties`);

            const response = await fetch(commandPath);
            this.#endpointProperties = await response.json();
            logger.info("Got endpoint properties");
        }
    };

    public getPeerProperties = async (): Promise<TPeerProperties> => {
        if (!this.#peerProperties) {
            const { commandPath } = APPELFLAPCOMMANDS.getPeerProperties;
            logger.info(`Getting peer properties`);

            const response = await fetch(commandPath);
            this.#peerProperties = await response.json();
            logger.info("Got peer properties");
        }

        return this.#peerProperties!;
    };

    public getLargeObjectIndexStatus = async (): Promise<any> => {
        const { commandPath } = APPELFLAPCOMMANDS.getLargeObjectIndexStatus;
        return await this.performCommand(commandPath);
    };
    //#endregion

    //#region Appleflap Actions
    public doRebootHard = async (): Promise<any> => {
        const { commandPath, method } = APPELFLAPCOMMANDS.doRebootHard;
        return await this.performCommand(commandPath, { method }, "text");
    };

    public doRebootSoft = async (): Promise<any> => {
        const { commandPath, method } = APPELFLAPCOMMANDS.doRebootSoft;
        return await this.performCommand(commandPath, { method }, "text");
    };

    public doLaunchWiFiPicker = async (): Promise<any> => {
        const { commandPath, method } = APPELFLAPCOMMANDS.doLaunchWiFiPicker;
        return await this.performCommand(commandPath, { method }, "text");
    };

    public doLaunchStorageManager = async (): Promise<any> => {
        const { commandPath, method } =
            APPELFLAPCOMMANDS.doLaunchStorageManager;
        return await this.performCommand(commandPath, { method }, "text");
    };
    //#endregion

    //#region Appleflap Info Blocks
    public infoWiFi = async (): Promise<TInfoWiFi> => {
        const { commandPath, method } = APPELFLAPCOMMANDS.infoWiFi;
        return await this.performCommand(commandPath, { method });
    };

    public infoPeers = async (): Promise<TPeers> => {
        const { commandPath, method } = APPELFLAPCOMMANDS.infoPeers;
        return await this.performCommand(commandPath, { method });
    };

    public infoStorage = async (): Promise<TInfoStorage> => {
        const { commandPath, method } = APPELFLAPCOMMANDS.infoStorage;
        return await this.performCommand(commandPath, { method });
    };
    //#endregion

    //#region Cache Administration
    public lock = async (): Promise<string> => {
        const { commandPath, method } = APPELFLAPCOMMANDS.setLock;
        logger.info(`'Locking' Bero`);
        return await this.performCommand(commandPath, { method }, "text");
    };

    public unlock = async (): Promise<string> => {
        const { commandPath, method } = APPELFLAPCOMMANDS.releaseLock;
        logger.info(`'Unlocking' Bero`);
        return await this.performCommand(commandPath, { method }, "text");
    };

    /**
     * Get the status of the cache from Appelflap
     * @deprecated No longer available from Appelflap, returns 404
     */
    public getCacheStatus = async (): Promise<any> => {
        const { commandPath } = APPELFLAPCOMMANDS.getCacheStatus;
        return await this.performCommand(commandPath);
    };
    //#endregion

    //#region Publication
    public getPublications = async (): Promise<TBundles> => {
        const { commandPath } = APPELFLAPCOMMANDS.getPublications;
        const bundles = await this.performCommand(commandPath);
        return bundles as Promise<TBundles>;
    };

    private publicationPath = (publication: TPublication) => {
        const bundleType = "CACHE";
        const prepWebOrigin = encodeURIComponent(publication.webOrigin);
        const prepCacheName = encodeURIComponent(publication.cacheName);
        return `${bundleType}/${prepWebOrigin}/${prepCacheName}/${publication.version}`;
    };

    public publish = async (publication: TPublication): Promise<string> => {
        const { commandPath, method } = APPELFLAPCOMMANDS.savePublication;
        const requestPath = `${commandPath}/${this.publicationPath(
            publication
        )}`;
        const commandInit = {
            method: method,
            headers: { Version: publication.version.toString() },
        };

        return await this.performCommand(requestPath, commandInit, "text");
    };
    //#endregion

    //#region Subscriptions
    public getSubscriptions = async (): Promise<TSubscriptions> => {
        const { commandPath } = APPELFLAPCOMMANDS.getSubscriptions;

        const subscriptions = await this.performCommand(commandPath);
        return subscriptions as Promise<TSubscriptions>;
    };

    public setSubscriptions = async (
        subscriptions: TSubscriptions
    ): Promise<TSubscriptions> => {
        const { commandPath, method } = APPELFLAPCOMMANDS.setSubscriptions;
        const requestPath = `${commandPath}`;
        const commandInit = {
            method: method,
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify(subscriptions),
        };

        return (await this.performCommand(
            requestPath,
            commandInit,
            "text"
        )) as Promise<TSubscriptions>;
    };

    /**
     * Get a list of all bundles that are 'injectable' into the cache in response to Subscriptions
     * @remarks this corresponds with @see getSubscriptions which are the bundles that have been subscribed to
     */
    public injectables = async (): Promise<TBundles> => {
        const { commandPath } = APPELFLAPCOMMANDS.getInjectables;

        logger.info(
            "Identifying all bundles ready for injection into the browser's cache"
        );
        const bundles = await this.performCommand(commandPath);
        return bundles as Promise<TBundles>;
    };
    //#endregion

    //#region Certificates
    public getCertificate = async (): Promise<TCertificate> => {
        const { commandPath } = APPELFLAPCOMMANDS.getCertificate;

        const certificate = (await this.performCommand(
            commandPath,
            undefined,
            "pem"
        )) as TCertificate;

        const certSigned = certificate.isCertSigned ? "signed" : "unsigned";
        logger.info(`Got ${certSigned} certificate`);
        return certificate;
    };

    public saveCertificate = async (
        certificate: TCertificate
    ): Promise<string> => {
        const { commandPath, method } = APPELFLAPCOMMANDS.saveCertificate;
        const cert = certificate.cert;
        const commandInit = {
            method: method,
            headers: { "content-type": "application/x-pem-file" },
            body: cert,
        };

        const certSigned = certificate.isCertSigned ? "signed" : "unsigned";
        logger.info(`Saving ${certSigned} certificate`);
        return await this.performCommand(commandPath, commandInit, "text");
    };

    public deleteCertificate = async (): Promise<string> => {
        const { commandPath, method } = APPELFLAPCOMMANDS.deleteCertificate;

        logger.info(`Deleting certificate`);
        return await this.performCommand(commandPath, { method }, "text");
    };
    //#endregion

    //#region Appelflap Debug

    //#endregion
}
