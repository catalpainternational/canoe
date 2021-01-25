import { setOnline, setOffline } from "ReduxImpl/Interface";

// subscribe to online and offline events to inform the store
window.addEventListener("online", setOnline);
window.addEventListener("offline", setOffline);