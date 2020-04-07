const fs = require('fs')
const path = require('path')
var gettextParser = require("gettext-parser");
 
const translationsFilePath = path.join('locale', 'tet', 'canoe.po')
const translationsContent = fs.readFileSync(translationsFilePath)
const parsedTranslations = gettextParser.po.parse(translationsContent)
const jsonFilePath = path.join('locale', 'json', 'tet.json')

fs.writeFileSync(jsonFilePath, JSON.stringify(parsedTranslations));
