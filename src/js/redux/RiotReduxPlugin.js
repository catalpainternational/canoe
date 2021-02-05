/// RiotReduxPlugin
// Install in your riot.install handler makes 'store' available on every riot
// component if your component has a storeListener function. It will be called
// while the component is mounted with the state before and after redux.
// Dispatches available as arguments.

import { store } from "ReduxImpl/Store";

export const installReduxPlugin = function (component) {
    if (typeof component.storeListener !== "function") {
        return;
    }

    // if the component has a storeListener function then subscribe it to the store
    const originalOnMounted = component.onMounted || (() => {});
    const originalOnBeforeUnmount = component.onBeforeUnmount || (() => {});

    // store state and subscribe on mount
    component.onMounted = function reduxOnMount(...args) {
        // store the previous state
        let previousState = store.getState();

        // subscribe to the redux store
        component.storeUnsubscribe = store.subscribe(function callStoreListener() {
            const state = store.getState();
            component.storeListener(previousState, state);
            // store the previous state
            previousState = store.getState();
        });

        // call the original mount
        originalOnMounted.apply(component, args);
    };
    // unsubscribe before unmount
    component.onBeforeUnmount = function reduxOnBeforeUnmount(...args) {
        component.storeUnsubscribe();
        delete component.storeUnsubscribe;
        // call the original beforeUnmount
        originalOnBeforeUnmount.apply(component, args);
    };
};
