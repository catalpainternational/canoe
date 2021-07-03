const { GettextExtractor, JsExtractors, HtmlExtractors } = require('gettext-extractor');

const extractor = new GettextExtractor();

const jsParserCommentOptions = {
    otherLineLeading: true,
};

function extractMessages(outputPath, projectIdVersion) {
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

    extractor.savePotFile(outputPath, {
        "Project-Id-Version": projectIdVersion,
        "Report-Msgid-Bugs-To": "engineering@catalpa.io",
        Language: "en",
    });

    extractor.printStats();
}

module.exports = {
    extractMessages
}