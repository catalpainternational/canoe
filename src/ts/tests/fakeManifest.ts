import { Manifest } from "../Implementations/Manifest";
import { TAssetEntry, TManifest, TPage } from "../Types/ManifestTypes";

function buildFakeManifestEntry(
    page_no: number,
    loc_hash: string,
    version: number,
    language: string,
    assets: Array<TAssetEntry> = [],
    children: Array<number> = [],
    depth: number
): TPage {
    const storage_container = loc_hash;
    return {
        loc_hash: `/site/canoe-${loc_hash}`,
        storage_container: `/site/canoe-${storage_container}`,
        version: version,
        api_url: `/api/v2/pages/${page_no}/`,
        assets: assets,
        language: language,
        children: children,
        depth: depth,
        isValid: true,
        isAvailableOffline: true,
        isPublishable: true,
    };
}

function buildFakeAssetEntry(type: string, asset_name: string): TAssetEntry {
    const renditions: Record<string, string> = {};

    [
        ["width-800|format-webp", "webp"],
        ["width-600|format-jpeg", "jpeg"],
        ["max-165x165", "png"],
    ].forEach((rendition_name) => {
        const key = rendition_name[0];
        const value = `${asset_name}.${rendition_name
            .join(".")
            .replace("|", ".")}`;
        renditions[key] = value;
    });

    return {
        type: type,
        renditions: renditions,
        isValid: true,
        isAvailableOffline: true,
        isPublishable: true,
    };
}

export function buildFakeManifest(): TManifest {
    const fakeMani = new Manifest();
    fakeMani.version = "0.0.1";
    fakeMani.pages["4"] = buildFakeManifestEntry(
        4,
        "home",
        3,
        "en",
        [],
        [10],
        3
    );
    fakeMani.pages["10"] = buildFakeManifestEntry(
        4,
        "home/course",
        21,
        "en",
        [],
        [12],
        4
    );
    fakeMani.pages["12"] = buildFakeManifestEntry(
        12,
        "home/course/lesson-1",
        21,
        "en",
        [
            buildFakeAssetEntry(
                "image",
                "images/Screenshot_2020-12-10_at_13.45.26"
            ),
        ],
        [],
        5
    );
    fakeMani.pages["5"] = buildFakeManifestEntry(
        5,
        "home-tet",
        4,
        "tet",
        [],
        [11],
        3
    );
    fakeMani.pages["5"] = buildFakeManifestEntry(
        11,
        "home-tet/course-tet",
        18,
        "tet",
        [],
        [13],
        4
    );
    fakeMani.pages["13"] = buildFakeManifestEntry(
        13,
        "home-tet/course-tet/lesson-1-tet",
        17,
        "en",
        [
            buildFakeAssetEntry(
                "image",
                "images/Screenshot_2020-12-10_at_13.45.26"
            ),
        ],
        [],
        5
    );
    fakeMani.pages["6"] = buildFakeManifestEntry(
        6,
        "resources",
        6,
        "en",
        [],
        [8],
        3
    );
    fakeMani.pages["8"] = buildFakeManifestEntry(
        8,
        "resources/example-resource",
        9,
        "en",
        [
            buildFakeAssetEntry(
                "image",
                "images/Screenshot_2020-12-13_at_10.02.36"
            ),
        ],
        [],
        4
    );
    fakeMani.pages["7"] = buildFakeManifestEntry(
        7,
        "resources-tet",
        7,
        "tet",
        [],
        [9],
        3
    );
    fakeMani.pages["9"] = buildFakeManifestEntry(
        9,
        "resources-tet/example-resource-tet",
        10,
        "tet",
        [
            buildFakeAssetEntry(
                "image",
                "images/Screenshot_2020-12-13_at_10.02.36"
            ),
        ],
        [],
        4
    );

    return fakeMani;
}
