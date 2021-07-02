/** A set of values that identify this user, as a peer for sharing */
export type TPeerProperties = {
    ID: number;
    /** A 4 character representation of the @see ID, that has been derived from the @see palette */
    friendly_ID: string;
    /** This is the 'palette' of characters from which the @see friendly_ID has been formed */
    palette: string;
};
