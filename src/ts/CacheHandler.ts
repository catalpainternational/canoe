export class CacheHandler {
    #cache: Cache;

    constructor() {
        this.#cache = new Cache();
    }

    /** Try to match a URL in the SW cache, ignore any query params in the url */
    match = async (url: string): Promise<Response | undefined> => {
        return await this.#cache.match(url, { ignoreSearch: true });
    };
}
