export type TBundle = {
    type: string;
    origin: string;
    name: string;
    version: number;
};

export type TBundleMeta = {
    bundle: TBundle;
    size: number;
    mtime: number;
};

export type TBundles = {
    bundles: Array<TBundleMeta>;
};

export type TBundleResults = {
    results: Array<{
        bundle: TBundle;
        success: boolean;
    }>;
};
