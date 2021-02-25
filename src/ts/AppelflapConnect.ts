/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
    TCertificate,
    TPublication,
    TPublications,
    TPublicationTarget,
    TSubscription,
    TSubscriptions,
    TSubscriptionVersion,
} from "ts/Types/CacheTypes";

/* eslint-disable prettier/prettier */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: For when the unit tests cannot find the declaration file
import { AF_CERTCHAIN_LENGTH_HEADER, AF_LOCALHOSTURI, APPELFLAPCOMMANDS, AppelflapPortNo } from "js/RoutingAppelflap";
// The above import statement MUST all appear on the one line for the @ts-ignore to work
/* eslint-enable prettier/prettier */

export class AppelflapConnect {
    /** Get the Authorisation Header details that Appelflap requires
     * @remarks See: https://github.com/catalpainternational/appelflap/blob/7a4072f8b914748563333238bb1a49ea527480bd/docs/API/determining-endpoint.md for more info
     * @returns The auth header as `Basic btoaEncodedStuff` or 'None' if the credentials are not available
     */
    get authHeader(): string {
        const credentialsExtract = (prefix: string) => {
            const rex = RegExp(`^${prefix}-[a-z]{5}$`);
            const match = navigator.languages.filter((word) =>
                rex.test(word)
            )[0];

            return match ? match.substring(4) : match;
        };

        const creds = ["ecu", "ecp"].map(credentialsExtract);
        return !creds.every(Boolean)
            ? "None"
            : `Basic ${btoa(creds.join(":"))}`;
    }

    private appelflapFetch = async (
        commandPath: string,
        commandInit?: RequestInit
    ): Promise<Response> => {
        const requestInfo = `${AF_LOCALHOSTURI}:${AppelflapPortNo()}/${commandPath}`;

        const authorization = this.authHeader;
        const weHaveAuthorization =
            ["Not Set", "None"].indexOf(authorization) === -1;

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
            case "pem":
                // A `application/x-pem-file` is actually a sub-type of `text`
                // But we need to include a little extra info from the repsonse header.
                // So we'll actually return it as an object (i.e. json)
                /* eslint-disable no-case-declarations */
                const encodedCertificate = await response.text();
                const isCertSigned =
                    response.headers.get(AF_CERTCHAIN_LENGTH_HEADER) === "3";
                const cert = {
                    cert: encodedCertificate,
                    isCertSigned: isCertSigned,
                } as TCertificate;
                /* eslint-enable no-case-declarations */

                return cert;
        }
    };

    public getMetaStatus = async (): Promise<any> => {
        const { commandPath } = APPELFLAPCOMMANDS.getMetaStatus;
        return await this.performCommand(commandPath);
    };

    public lock = async (): Promise<string> => {
        const { commandPath, method } = APPELFLAPCOMMANDS.setLock;
        return await this.performCommand(commandPath, { method }, "text");
    };

    public unlock = async (): Promise<string> => {
        const { commandPath, method } = APPELFLAPCOMMANDS.releaseLock;
        return await this.performCommand(commandPath, { method }, "text");
    };

    public getCacheStatus = async (): Promise<any> => {
        const { commandPath } = APPELFLAPCOMMANDS.getCacheStatus;
        return await this.performCommand(commandPath);
    };

    public doReboot = async (): Promise<any> => {
        const { commandPath, method } = APPELFLAPCOMMANDS.doReboot;
        return await this.performCommand(commandPath, { method }, "text");
    };

    public getPublications = async (): Promise<TPublications> => {
        const { commandPath } = APPELFLAPCOMMANDS.getPublications;
        return (await this.performCommand(
            commandPath
        )) as Promise<TPublications>;
    };

    private publicationPath = (publication: TPublicationTarget) => {
        const prepWebOrigin = encodeURIComponent(publication.webOrigin);
        const prepCacheName = encodeURIComponent(publication.cacheName);
        return `${prepWebOrigin}/${prepCacheName}`;
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

    public unpublish = async (
        publication: TPublicationTarget
    ): Promise<string> => {
        const { commandPath, method } = APPELFLAPCOMMANDS.deletePublication;
        const requestPath = `${commandPath}/${this.publicationPath(
            publication
        )}`;

        return await this.performCommand(requestPath, { method }, "text");
    };

    public getSubscriptions = async (): Promise<TSubscriptions> => {
        const { commandPath } = APPELFLAPCOMMANDS.getSubscriptions;

        return (await this.performCommand(
            commandPath
        )) as Promise<TSubscriptions>;
    };

    /** Build the Version Min and Max headers.
     * This method 'assumes responsibility' for the values provided to it.
     * @param { TSubscription | TSubscriptionVersion } versionRange
     * - A subscription or subscriptionVersion that identifies none, either or both a version min and a version max value
     * @returns { Record<string, string> | undefined }
     * undefined if there were no version min or max values, otherwise a header with the relevant values
     * @throws { RangeError } If both a min and max are provided and they are incorrectly ordered
     */
    // private buildVersionHeaders = (
    //     versionRange: TSubscription | TSubscriptionVersion
    // ): Record<string, string> | undefined => {
    //     let min = -1;
    //     let max = -1;
    //     const hasMin = typeof versionRange.versionMin === "number";
    //     const hasMax = typeof versionRange.versionMax === "number";
    //     if (hasMin || hasMax) {
    //         if (
    //             hasMin &&
    //             hasMax &&
    //             versionRange.versionMin! > versionRange.versionMax!
    //         ) {
    //             throw new RangeError(
    //                 "versionMin must be less than or equal to versionMax"
    //             );
    //         }
    //         if (hasMin && versionRange.versionMin! > 0) {
    //             min = versionRange.versionMin!;
    //         }
    //         if (hasMax && versionRange.versionMax! > 0) {
    //             max = versionRange.versionMax!;
    //         }
    //     }
    //     if (min > -1 || max > -1) {
    //         const headers: Record<string, string> = {};
    //         if (min > -1) {
    //             headers["Version-Min"] = min.toString();
    //         }
    //         if (max > -1) {
    //             headers["Version-Max"] = max.toString();
    //         }
    //         return headers;
    //     }

    //     return undefined;
    // };

    public setSubscriptions = async (
        subscriptions: TSubscriptions
    ): Promise<string> => {
        const { commandPath, method } = APPELFLAPCOMMANDS.setSubscriptions;
        const requestPath = `${commandPath}`;
        const commandInit = {
            method: method,
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify(subscriptions),
        };

        return await this.performCommand(requestPath, commandInit, "text");
    };

    public getCertificate = async (): Promise<TCertificate> => {
        const { commandPath } = APPELFLAPCOMMANDS.getCertificate;

        return (await this.performCommand(
            commandPath,
            undefined,
            "pem"
        )) as Promise<TCertificate>;
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

        return await this.performCommand(commandPath, commandInit, "text");
    };

    public deleteCertificate = async (): Promise<string> => {
        const { commandPath, method } = APPELFLAPCOMMANDS.deleteCertificate;

        return await this.performCommand(commandPath, { method }, "text");
    };
}
