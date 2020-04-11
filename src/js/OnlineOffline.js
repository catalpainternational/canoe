/* OnlineOffline
 * Connects window network state events to redux
 */

import { changeNetworkState } from "ReduxImpl/Store";

window.addEventListener("online", () => {
    changeNetworkState('online');
});
window.addEventListener("offline", () => {
    changeNetworkState('offline');
});
