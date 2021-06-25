export type TPublicationTarget = {
    webOrigin: string;
    cacheName: string;
};

export type TPublicationVersion = {
    version: number;
};

export type TPublication = {
    bundleType: string;
} & TPublicationTarget &
    TPublicationVersion;

export type TPublicationSize = {
    size: number;
};

export type TSubscriptionVersion = {
    injection_version_min?: number;
    injection_version_max?: number;
    p2p_version_min?: number;
    p2p_version_max?: number;
    injected_version?: number | null;
};

export type TSubscription = TPublicationTarget & TSubscriptionVersion;

export type TSubscriptions = {
    types: Record<
        string,
        {
            groups: Record<
                string,
                { names: Record<string, TSubscriptionVersion> }
            >;
        }
    >;
};

export type TCertificate = {
    /** The body of the pem certificate file, as a text string */
    cert: string;
    isCertSigned: boolean;
};
