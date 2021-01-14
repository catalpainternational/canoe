// js/RoutingAppelflap

/** Note that the module name here MUST match how it's used in the .ts files */
declare module "js/RoutingAppelflap" {
    import { THttpMethods } from "ts/Types/CanoeEnums";

    export const AF_LOCALHOSTURI: string;

    export const AF_API_PREFIX: string;

    export const AF_EIKEL_API: string;
    export const AF_META_API: string;
    export const AF_CACHE_API: string;
    export const AF_ACTION_API: string;

    export const AF_INS_LOCK: string;
    export const AF_PUBLICATIONS: string;
    export const AF_SUBSCRIPTIONS: string;
    export const AF_STATUS: string;
    export const AF_REBOOT: string;

    export const APPELFLAPCOMMANDS: {
        [name: string]: { commandPath: string; method: THttpMethods };
    };

    /** Get the port number that Appelflap is using or return -1 */
    export function AppelflapPortNo(): number;
}
