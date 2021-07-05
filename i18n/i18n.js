const path = require("path");
const { extractMessages } = require("./Extract.js");
const { updatePoFiles } = require("./PoUpdater.js");
const { updateJsonFiles } = require("./JsonUpdater.js");

const args = process.argv.slice(2);
const masterPotPath = path.resolve(path.dirname(__dirname), "locale", "bero.pot");
const localePath = path.resolve(path.dirname(__dirname), "locale");
const language_codes = ["tet", "fr"];

extractMessagesCall = () => {
    return extractMessages(
        masterPotPath,
        "Bero",
    );
};
updatePoFilesCall = () => {
    return updatePoFiles(
        masterPotPath,
        localePath,
        language_codes,
    );
};
updateJsonFilesCall = () => {
    return updateJsonFiles(
        localePath,
        language_codes,
    );
};

switch(args[0]) {
    case 'extract':
    case 'e':
        extractMessagesCall();
        break;
    case 'pofiles':
    case 'p':
        updatePoFilesCall();
        break;
    case 'json':
    case 'j':
        updateJsonFilesCall();
        break;
    case 'all':
    case 'a':
        extractMessagesCall();
        updatePoFilesCall();
        updateJsonFilesCall();
        break;
    default: 
        console.log(`Bero internationalisation tools
            call with 'extract' or 'e' to extract all source translatable strings into the master pot file
            call with 'pofiles' or 'p' to update all language po files with new master content
            call with 'json' or 'j' to serialize language po file content into json
            call witl 'all' or 'a' to do it all!
        `);
}