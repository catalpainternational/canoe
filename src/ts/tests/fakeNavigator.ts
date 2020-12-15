function get_portno_encoded(portNo: number): string {
    const encodeOffset = "a".charCodeAt(0);
    return String.fromCharCode(
        ...[...portNo.toString()].map((digit: string) => {
            return Number(digit) + encodeOffset;
        })
    );
}

export function buildFakeNavigator(portNo?: number): Navigator {
    const languages = ["en", "tdt"];
    if (portNo) {
        languages.push(`ep-${get_portno_encoded(portNo)}`);
    }
    return {
        languages: languages,
        activeVRDisplays: [],
        clipboard: {} as Clipboard,
        credentials: {} as CredentialsContainer,
        doNotTrack: "1",
        geolocation: {} as Geolocation,
        maxTouchPoints: 0,
        mediaDevices: {} as MediaDevices,
        msManipulationViewsEnabled: false,
        msMaxTouchPoints: 0,
        msPointerEnabled: false,
        permissions: {} as Permissions,
        pointerEnabled: false,
        serviceWorker: {} as ServiceWorkerContainer,
        getGamepads: () => [],
        getUserMedia: () => {
            return;
        },
        getVRDisplays: () => Promise.resolve([]),
        msLaunchUri: () => {
            return;
        },
        requestMediaKeySystemAccess: () =>
            Promise.resolve({} as MediaKeySystemAccess),
        sendBeacon: () => false,
        share: () => Promise.resolve(),
        vibrate: () => false,
        msSaveBlob: () => false,
        msSaveOrOpenBlob: () => false,
        confirmSiteSpecificTrackingException: () => false,
        confirmWebWideTrackingException: () => false,
        removeSiteSpecificTrackingException: () => {
            return;
        },
        removeWebWideTrackingException: () => {
            return;
        },
        storeSiteSpecificTrackingException: () => {
            return;
        },
        storeWebWideTrackingException: () => {
            return;
        },
        webdriver: false,
        hardwareConcurrency: 0,
        registerProtocolHandler: () => {
            return;
        },
        unregisterProtocolHandler: () => {
            return;
        },
        cookieEnabled: false,
        appCodeName: "aCodeName",
        appName: "aName",
        appVersion: "aVer",
        platform: "plat",
        product: "p",
        productSub: "pSub",
        userAgent: "ua",
        vendor: "v",
        vendorSub: "vSub",
        language: "en",
        onLine: false,
        mimeTypes: {} as MimeTypeArray,
        plugins: {} as PluginArray,
        javaEnabled: () => false,
        storage: {} as StorageManager,
    } as Navigator;
}
