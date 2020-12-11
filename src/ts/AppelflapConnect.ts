export function getPortNo(): number | undefined {
    // Appelflap knows the port number (which is randomly picked at launch); and it needs to let the web context know what the port number is.
    // It could be learned via a call to a contentscript (WebExtension), but that won't work in a ServiceWorker. Hence, we stuff it in the language
    // tags, which are available inside a ServiceWorker context.
    // This is not a security measure or anything — it's just that we can't use a statically defined port, because we simply don't know whether
    // it won't already be occupied. Similarly the charcode shifting is not obfuscation, it's just that Geckoview is picky about what we pass
    // as a language tag.
    const portword = navigator.languages.filter((word) =>
        /^ep-[a-j]{4,5}$/.test(word)
    )[0];

    if (!portword) {
        return;
    }

    return parseInt(
        portword
            .split("")
            .slice(3)
            .map((el) => String.fromCharCode(el.charCodeAt(0) - 0x31))
            .join(""),
        10
    );
}

export const appelflapFetch = async (
    request_or_url: RequestInfo,
    maybe_fetchopts: RequestInit | undefined
): Promise<Response> => {
    return await fetch(request_or_url, maybe_fetchopts);
};

export const appelflapMeta = async (): Promise<string> => {
    const portNo = getPortNo();
    const statusRequestURI = `http://127.0.0.1:${portNo}/meta/status`;

    const response = await appelflapFetch(statusRequestURI, undefined);

    if (!response.ok) {
        return "Nope, that's not OK";
    }

    const pagesResponseJSON = await response.json();

    return pagesResponseJSON;
};
