/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
    TInfoStorage,
    TInfoWiFi,
    TPeerProperties,
    TPeers,
} from "../Types/InfoTypes";
import { AppelflapConnect } from "./AppelflapConnect";

export class AppelflapUtilities {
    /** Get the 'peer' properties from Appelflap for this user */
    static async peerProperties(): Promise<TPeerProperties | undefined> {
        if (AppelflapConnect.getInstance()) {
            return await AppelflapConnect.getInstance()!.getPeerProperties();
        }
    }

    //#region Appleflap Info Blocks
    static async infoWiFi(): Promise<TInfoWiFi | undefined> {
        if (AppelflapConnect.getInstance()) {
            return await AppelflapConnect.getInstance()!.infoWiFi();
        }
    }

    /** Get the properties for the current 'peers' of this user */
    static async infoPeers(): Promise<TPeers | undefined> {
        if (AppelflapConnect.getInstance()) {
            return await AppelflapConnect.getInstance()!.infoPeers();
        }
    }

    static async infoStorage(): Promise<TInfoStorage | undefined> {
        if (AppelflapConnect.getInstance()) {
            return await AppelflapConnect.getInstance()!.infoStorage();
        }
    }
    //#endregion

    /**
     * Get the status of the cache from Appelflap
     * @deprecated No longer available from Appelflap, returns 404
     */
    static async status(): Promise<any> {
        if (AppelflapConnect.getInstance()) {
            return JSON.parse(
                await AppelflapConnect.getInstance()!.getCacheStatus()
            );
        }
        return {};
    }

    /** Instruct Appelflap to hard reboot Bero */
    static async rebootHard(): Promise<void> {
        if (AppelflapConnect.getInstance()) {
            await AppelflapConnect.getInstance()!.doRebootHard();
        }
    }

    /** Instruct Appelflap to soft reboot Bero */
    static async rebootSoft(): Promise<void> {
        if (AppelflapConnect.getInstance()) {
            await AppelflapConnect.getInstance()!.doRebootSoft();
        }
    }

    /** Instruct Appelflap to launch the Android WiFi picker */
    static async launchWiFiPicker(): Promise<void> {
        if (AppelflapConnect.getInstance()) {
            await AppelflapConnect.getInstance()!.doLaunchWiFiPicker();
        }
    }

    /** Instruct Appelflap to launch the Android storage manager */
    static async launchStorageManager(): Promise<void> {
        if (AppelflapConnect.getInstance()) {
            await AppelflapConnect.getInstance()!.doLaunchStorageManager();
        }
    }
}
