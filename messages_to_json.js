const fs = require('fs')
const path = require('path')
var gettextParser = require("gettext-parser");
 
const fileName = 'tt-tl.po'
const translationsFilePath = path.join('locale', 'po', fileName)
const translationsContent = fs.readFileSync(translationsFilePath)
const parsedTranslations = gettextParser.po.parse(translationsContent)
const jsonFilePath = path.join('locale', 'json', 'tm-tl.json')

fs.writeFileSync(jsonFilePath, JSON.stringify(parsedTranslations));
