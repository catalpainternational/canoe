import pureSubscribe from "redux-pure-subscribe";
import { store } from "./Store";

export const storeSubscribers = (callback, targets) => {
    // pureSubscribe will only fire the callback when the state actually changes
    // it provides the current state (not previous) to the callback
    return pureSubscribe(store, callback, targets);
};
