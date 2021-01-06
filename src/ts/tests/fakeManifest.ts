import { TAssetEntry, TPage } from "../Types/ManifestTypes";

function buildFakeManifestEntry(
    page_no: number,
    loc_hash: string,
    storage_container: string,
    version: number,
    language: string,
    assets: Array<TAssetEntry> = [],
    children: Array<number> = [],
    depth: number
): TPage {
    return {
        loc_hash: `/site/canoe-${loc_hash}`,
        storage_container: `/site/canoe-${storage_container}`,
        version: version,
        api_url: `/api/v2/pages/${page_no}/`,
        assets: assets,
        language: language,
        children: children,
        depth: depth,
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

    return { type: type, renditions: renditions };
}

export function buildFakeManifest(): {
    version: string;
    pages: Record<string, TPage>;
} {
    return {
        version: "0.0.1",
        pages: {
            "4": buildFakeManifestEntry(
                4,
                "home",
                "home",
                3,
                "en",
                [],
                [10],
                3
            ),
            "10": buildFakeManifestEntry(
                10,
                "home/course",
                "home/course",
                21,
                "en",
                [],
                [12],
                4
            ),
            "12": buildFakeManifestEntry(
                12,
                "home/course/lesson-1",
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
            ),
            "5": buildFakeManifestEntry(
                5,
                "home-tet",
                "home-tet",
                4,
                "tet",
                [],
                [11],
                3
            ),
            "11": buildFakeManifestEntry(
                11,
                "home-tet/course-tet",
                "home-tet/course-tet",
                18,
                "tet",
                [],
                [13],
                4
            ),
            "13": buildFakeManifestEntry(
                13,
                "home-tet/course-tet/lesson-1-tet",
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
            ),
            "6": buildFakeManifestEntry(
                6,
                "resources",
                "resources",
                6,
                "en",
                [],
                [8],
                3
            ),
            "8": buildFakeManifestEntry(
                8,
                "resources/example-resource",
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
            ),
            "7": buildFakeManifestEntry(
                7,
                "resources-tet",
                "resources-tet",
                7,
                "tet",
                [],
                [9],
                3
            ),
            "9": buildFakeManifestEntry(
                9,
                "resources-tet/example-resource-tet",
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
            ),
        },
    };
}
