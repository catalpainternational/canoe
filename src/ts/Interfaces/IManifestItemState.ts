/** Describe the state of a manifest, page or asset item */
export interface IManifestItemState {
    /** Is this manifest, page or asset item available offline?
     * @remarks This is used to indicate to the UI that a given item is ready for rendering
     * @returns true if all items referenced by this manifest, page or asset item are available offline as well
     */
    isAvailableOffline: boolean;

    /** Is this manifest, page or asset item complete (in itself) and ready for distribution?
     * @remarks This is used to tell Appelflap that this individual item can be shared to other devices
     * @returns true is this item itself is complete and the most recent that is known about amongst all the devices currently connected
     */
    isPublishable: boolean;
}
