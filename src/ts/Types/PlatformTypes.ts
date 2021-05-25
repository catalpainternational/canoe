export type TBrowser = {
    name: any;
    version: any;
};

export type TPlatform = {
    browser: TBrowser;
    inAppelflap: boolean;
    inPWAMode: boolean;
};
