import { initialiseCertChain } from "./Appelflap/StartUp";
import Logger from "./Logger";

// See ts/Typings for the type definitions for these imports
import { isAuthenticated, subscribeToStore } from "ReduxImpl/Interface";

const logger = new Logger("AuthStateChange");

/**
 * Monitors the Authentication State for changes and performs actions
 * This corresponds (a little) to the UserAction.js code which also watches this stuff
 */
export class AuthStateChange {
    //#region Implement as Singleton
    static instance: AuthStateChange;
    #currentAuthState = false;

    private constructor() {
        logger.log("Singleton created");
    }

    /** Gets the single instance of AuthStateChange */
    public static get Instance(): AuthStateChange {
        if (!AuthStateChange.instance) {
            AuthStateChange.instance = new AuthStateChange();
        }

        return AuthStateChange.instance;
    }
    //#endregion

    async initialise(): Promise<boolean> {
        logger.info("Initialise");
        try {
            subscribeToStore(this.storeListener);
            this.logAuthState();
        } catch (e) {
            return false;
        }

        return true;
    }

    private logAuthState() {
        logger.log(
            `Current authentication state is ${
                this.#currentAuthState ? "" : "un"
            }authenicated`
        );
    }

    /** React to login and out state changes */
    private storeListener() {
        const newAuthState = isAuthenticated();
        this.logAuthState();
        if (newAuthState !== this.#currentAuthState) {
            this.#currentAuthState = newAuthState;
            this.logAuthState();
            if (newAuthState) {
                // (re)initialise the appelflap package publishing cert
                initialiseCertChain();
            } else {
                // 'delete' the appelflap package publishing cert
            }
        }
    }
}
