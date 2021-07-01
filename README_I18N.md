# Internationalization

**We currently support English, Tetum and French.**

An implementation can limit these languages to a subset of these by using the LANGUAGES project configuration array.

The default language for first time use is the DEFAULT_LANGUAGE project configuration.

Initial language is the default language or preferred browser language choice `navigator.language` if set and supported.

## Supporting translations in your code

Wrap all interface strings in `gettext()` or `ngettext()` calls.
Code has access to implementations of `gettext` and `ngettext` provided by the gettext.js dependency, and made available to all webpack compiled files through webpack ProvidePlugin.

## Updating translations

The easiest way for developers to add translations is to hand edit the po files in ./locale/&lt;lang&gt;/bero.po files.


Developers can allow non-developers to update translations by using [Transifex](https://www.transifex.com/catalpa/canoe)
Update the `transifex_translations` branch with the latest source messages, and Transifex will pull this content, make available for users to translate, then PR back in when 100% complete or updated.

## Adding translations

*Requires [GNU gettext](https://www.gnu.org/software/gettext/manual/gettext.html) tools installed on your dev machine

1. Detect new strings

Any uses of `gettext` or `ngettext` are detected using the dev dependency gettext-extractor, collect all strings into a .pot file in ./locale/bero.pot.

Run this on its own with `yarn node i18n/i18n.js extract`

2. Update individual language files

`msgmerge` is used to update individual langauge po files with content from the global `bero.pot`
`msgmerge --update --no-location --no-wrap locale/<lang>/bero.po locale/bero.pot`

Run this on its own for all Bero languages with `yarn node i18n/i18n.js pofiles`

3. Compile into json

`gexttext.js` dependency provides the po2json-gettextjs script, that we can use to provide individual language json files which are compiled into the code bundle.
`yarn run po2json-gettextjs locale/tet/bero.po locale/tet/bero.json -p`

Run this on its own for all Bero languages with `yarn node i18n/i18n.js json`


All the above steps can be performed for all languages using `yarn translate`

## Adding a new language

1. Create a new .po file and save in `./locale/<lang>/bero.po`

You can use a number of tools to create a po file. GNU gettext `msginit` command line, or Poedit
2. Edit `src/js/Translations.js`:AVAILABLE_LANGUAGES to enable it and provide it a name
3. Edit `i18n/i18n.js`:language_codes to make sure the tool chain updates and builds it
4. Use the guidance above to make sure it has all necessary messages
5. Configure your project to use the new language in the project config js file
