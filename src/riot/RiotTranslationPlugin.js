/// RiotTranslationsPlugin
// install in your riot.install handler
// Looks for all elements with a 'translate' attributen replaces content with gettext(content)

import { gettext } from "js/Translation";

const ORIGINAL_TRANSLATION_ATTRIBUTE = "canoe_translation_original";

export const installTranslationPlugin = function (component) {
    const originalOnUpdated = component.onUpdated || (() => {});

    component.onUpdated = function translateOnUpdated(...args) {
        originalOnUpdated.apply(component, args);
        component.$$("[translate]").forEach((element) => {
            if (!element.hasAttribute(ORIGINAL_TRANSLATION_ATTRIBUTE)) {
                element.setAttribute(ORIGINAL_TRANSLATION_ATTRIBUTE, element.innerText);
            }
            element.innerText = gettext(element.getAttribute(ORIGINAL_TRANSLATION_ATTRIBUTE));
        });
    };
};
