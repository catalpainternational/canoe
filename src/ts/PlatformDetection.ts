export function getPlatform(): {
    browser: {
        name: any;
        version: any;
    };
    inAppelflap: boolean;
    inPWAMode: boolean;
} {
    const browser = getBrowser();

    return {
        browser,
        inAppelflap: inAppelflap(),
        inPWAMode: inPWAMode(),
    };
}

export function getBrowser(): {
    name: any;
    version: any;
} {
    const ua = navigator.userAgent;
    let tem: any;
    let M: any[] =
        ua.match(
            /(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i
        ) || [];

    if (/trident/i.test(M[1])) {
        tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
        return { name: "IE", version: tem[1] || "" };
    }

    if (M[1] === "Chrome") {
        tem = ua.match(/\bOPR\/(\d+)/);
        if (tem != null) {
            return { name: "Opera", version: tem[1] };
        }
    }

    M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, "-?"];
    if ((tem = ua.match(/version\/(\d+)/i)) != null) {
        M.splice(1, 1, tem[1]);
    }

    if (navigator.userAgent.startsWith("io.catalpa.canoe.")) {
        M = ["Firefox", 1000];
    }

    return {
        name: M[0],
        version: M[1],
    };
}

export function inAppelflap(): boolean {
    return navigator.userAgent.startsWith("io.catalpa.canoe.");
}

function inPWAMode(): boolean {
    return window.matchMedia("(display-mode: standalone)").matches;
}
