export type TPublicationTarget = {
    webOrigin: string;
    cacheName: string;
};

export type TPublicationVersion = {
    version: number;
};

export type TPublication = TPublicationTarget & TPublicationVersion;

export type TPublicationSize = {
    size: number;
};

export type TPublications = {
    [name: string]: {
        [name: string]: TPublicationVersion & TPublicationSize;
    };
};

export type TSubscriptionVersion = {
    versionMin?: number;
    versionMax?: number;
};

export type TSubscription = TPublicationTarget & TSubscriptionVersion;

export type TSubscriptions = {
    [name: string]: {
        [name: string]: TSubscriptionVersion;
    };
};

export type TCertificate = {
    /** The body of the pem certificate file, as a text string */
    cert: string;
    isCertSigned: boolean;
};
