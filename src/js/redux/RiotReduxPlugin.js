/// RiotReduxPlugin
// install in your riot.install handler
// makes 'store' available on every riot component
// if your component has a storeListener function it will be called while the component is mounted
// with the state before and after redux dispatches available as arguments

export const installReduxPlugin = function(component, store) {

    // if the component has a storeListener function then subscribe it to the store
    if (typeof component.storeListener === "function") {
        const originalOnMounted = component.onMounted || function() {};
        const originalOnBeforeUnmount = component.onBeforeUnmount || function() {};

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
            // call the original beforeUnmount
            originalOnBeforeUnmount.apply(component, args);
        };
    };
};
