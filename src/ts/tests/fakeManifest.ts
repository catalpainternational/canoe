import { TAssetEntry, TManifestEntry } from "../Types/ManifestTypes";

function buildFakeManifestEntry(
    loc_hash: string,
    storage_container: string,
    page_no: number,
    language: string,
    assets: Array<TAssetEntry> = []
): TManifestEntry {
    return {
        loc_hash: `/site/canoe-${loc_hash}`,
        storage_container: `/site/canoe-${storage_container}`,
        api_url: `/api/v2/pages/${page_no}/`,
        assets: assets,
        language: language,
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
    pages: Array<TManifestEntry>;
} {
    return {
        version: "0.0.1",
        pages: [
            buildFakeManifestEntry("home", "home", 4, "en"),
            buildFakeManifestEntry("home/course", "home/course", 10, "en"),
            buildFakeManifestEntry(
                "home/course/lesson-1",
                "home/course/lesson-1",
                12,
                "en",
                [
                    buildFakeAssetEntry(
                        "image",
                        "images/Screenshot_2020-12-10_at_13.45.26"
                    ),
                ]
            ),
            buildFakeManifestEntry("home-tet", "home-tet", 5, "tet"),
            buildFakeManifestEntry(
                "home-tet/course-tet",
                "home-tet/course-tet",
                11,
                "tet"
            ),
            buildFakeManifestEntry(
                "home-tet/course-tet/lesson-1-tet",
                "home-tet/course-tet/lesson-1-tet",
                13,
                "en",
                [
                    buildFakeAssetEntry(
                        "image",
                        "images/Screenshot_2020-12-10_at_13.45.26"
                    ),
                ]
            ),
            buildFakeManifestEntry("resources", "resources", 6, "en"),
            buildFakeManifestEntry(
                "resources/example-resource",
                "resources/example-resource",
                8,
                "en",
                [
                    buildFakeAssetEntry(
                        "image",
                        "images/Screenshot_2020-12-13_at_10.02.36"
                    ),
                ]
            ),
            buildFakeManifestEntry("resources-tet", "resources-tet", 7, "tet"),
            buildFakeManifestEntry(
                "resources-tet/example-resource-tet",
                "resources-tet/example-resource-tet",
                9,
                "tet",
                [
                    buildFakeAssetEntry(
                        "image",
                        "images/Screenshot_2020-12-13_at_10.02.36"
                    ),
                ]
            ),
        ],
    };
}
