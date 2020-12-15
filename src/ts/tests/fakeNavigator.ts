export function buildFakeNavigator(): Navigator {
    return {
        languages: ["ep-abcd"],
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
