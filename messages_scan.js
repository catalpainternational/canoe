const { GettextExtractor, JsExtractors, HtmlExtractors } = require("gettext-extractor");

const extractor = new GettextExtractor();

const jsParserCommentOptions = {
    otherLineLeading: true,
};

const jsParser = extractor
    .createJsParser([
        JsExtractors.callExpression("gettext", {
            arguments: {
                text: 0,
            },
            comments: jsParserCommentOptions,
        }),
        JsExtractors.callExpression("ngettext", {
            arguments: {
                text: 0,
                textPlural: 1,
            },
            comments: jsParserCommentOptions,
        }),
    ])
    .parseFilesGlob("./src/**/*.@(ts|js|mjs|cjs)");

extractor
    .createHtmlParser([
        HtmlExtractors.elementContent("[translate]", {
            attributes: {
                textPlural: "translate-plural",
                context: "translation-context",
                comment: "translation-comment",
            },
        }),
        HtmlExtractors.embeddedJs("script", jsParser),
    ])
    .parseFilesGlob("./src/**/*.html");

extractor.savePotFile("./locale/canoe.pot", {
    "Project-Id-Version": "Canoe",
    "Report-Msgid-Bugs-To": "engineering@catalpa.io",
    Language: "en",
});

extractor.printStats();
