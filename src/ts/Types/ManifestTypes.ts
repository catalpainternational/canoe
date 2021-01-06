export type TAssetEntry = {
    type: string;
    renditions: Record<string, string>;
};

export type TPage = {
    loc_hash: string;
    storage_container: string;
    version: number;
    api_url: string;
    assets: Array<TAssetEntry>;
    language: string;
    children: Array<number>;
    depth: number;
};
