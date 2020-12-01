import { CanoeStore } from "./Store";
import { CanoeCache } from "./Cache";
import { CanoeFetch } from "./Fetch";

/** CanoeStoreCacheFetch - These three are commonly used together */
export interface CanoeStoreCacheFetch {
    store: CanoeStore;
    cache: CanoeCache;
    fetch: CanoeFetch;
}
