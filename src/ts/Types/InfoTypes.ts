/** A set of values that identify this user, as a peer for sharing */
export type TPeerProperties = {
    ID: number;
    /** A 4 character representation of the @see ID, that has been derived from the @see palette */
    friendly_ID: string;
    /** This is the 'palette' of characters from which the @see friendly_ID has been formed */
    palette?: string;
};

/** A list of peers of this user */
export type TPeers = Array<TPeerProperties>;

export type TInfoWiFi = {
    ssid: string;
    /**
     * IP Address correctly formatted
     */
    ipaddress: string;
    /**
     * IP Address as a simple number
     */
    ipaddress_raw: number;
    strength: number;
};

export type TInfoStorage = {
    /** Disk size in Bytes */
    disksize: number;
    /** Disk space free in Bytes */
    diskfree: number;
};
