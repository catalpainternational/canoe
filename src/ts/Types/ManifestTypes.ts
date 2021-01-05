export type TAssetEntry = {
    type: string;
    renditions: Record<string, string>;
};

export type TManifestEntry = {
    loc_hash: string;
    storage_container: string;
    api_url: string;
    assets: Array<TAssetEntry>;
    language: string;
};
