import { storeBrowserSupport } from "ReduxImpl/Interface";

export function initialiseBrowserSupport() {
    const is_iOSChrome = navigator.userAgent.match('CriOS');
    storeBrowserSupport(!is_iOSChrome);
}