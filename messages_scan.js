const { GettextExtractor, JsExtractors, HtmlExtractors } = require("gettext-extractor");

const extractor = new GettextExtractor();

const jsParser = extractor
    .createJsParser([
        JsExtractors.callExpression("getText", {
            arguments: {
                text: 0,
                context: 1,
            },
        }),
        JsExtractors.callExpression("getPlural", {
            arguments: {
                text: 1,
                textPlural: 2,
                context: 3,
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
