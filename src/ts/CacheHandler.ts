export class CacheHandler {
    /** Try to match a URL in the SW cache, ignore any query params in the url */
    match = async (
        url: string,
        cacheName: string
    ): Promise<Response | undefined> => {
        return await caches.match(url, {
            cacheName: cacheName,
            ignoreSearch: true,
        });
    };
}
