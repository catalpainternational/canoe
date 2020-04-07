const { GettextExtractor, JsExtractors, HtmlExtractors } = require("gettext-extractor");

const extractor = new GettextExtractor();

const jsParser = extractor
    .createJsParser([
        JsExtractors.callExpression("gettext", {
            arguments: {
                text: 0,
            },
        }),
        JsExtractors.callExpression("ngettext", {
            arguments: {
                text: 0,
                textPlural: 1,
            },
        }),
    ])
    .parseFilesGlob("./src/**/*.@(ts|js|tsx|jsx)");

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
