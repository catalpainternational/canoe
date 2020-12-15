export type TPublicationTarget = {
    webOrigin: string;
    cacheName: string;
};

export type TPublicationVersion = {
    version: number;
};

export type TPublication = TPublicationTarget & TPublicationVersion;

export type TSubscriptionVersion = {
    "Version-Min"?: number;
    "Version-Max"?: number;
};

export type TSubscription = TPublicationTarget & TSubscriptionVersion;

export type TSubscriptions = {
    [name: string]: {
        [name: string]: TSubscriptionVersion;
    };
};
