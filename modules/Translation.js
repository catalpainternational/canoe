import Gettext from "node-gettext";
import tetumTranslations from "../locale/json/tm-tl.json";

const gt = new Gettext();
gt.addTranslations("tetum", "messages", tetumTranslations);
gt.setLocale("tetum");

gt.on("error", (error) => console.log("oh nose", error));

export function getText(key) {
    return gt.gettext(key);
}

export function getLocale() {
    return gt.locale;
}

export function setLocale(locale) {
    gt.setLocale(locale);
}
