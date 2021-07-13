/** A set of values that identify this user, as a peer for sharing */
export type TPeerProperties = {
    id: number;
    /** A 4 character representation of the @see id, that has been derived from the @see palette */
    friendly_id: string;
    /** This is the 'palette' of characters from which the @see friendly_id has been formed */
    palette?: string;
};

/** A list of peers of this user */
export type TPeers = Array<TPeerProperties>;

export type TInfoWiFi = {
    network: {
        ssid: string;
        /** IP Address correctly formatted */
        ipaddress: string;
        /** IP Address as a simple number */
        ipaddress_raw: number;
        /** This is expressed as a number in the range 0-100 (inclusive) */
        strength: number;
    } | null;
};

export type TInfoStorage = {
    /** Disk size in Bytes */
    disksize: number;
    /** Disk space free in Bytes */
    diskfree: number;
};
