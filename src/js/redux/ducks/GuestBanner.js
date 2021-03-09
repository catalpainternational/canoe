// ACTIONS
const TOGGLED_GUEST_BANNER = "guestBanner/toggled";

// ACTION CREATOR
export const toggleGuestBanner = (trueOrFalse) => ({
    type: TOGGLED_GUEST_BANNER,
    isGuestBannerVisible: trueOrFalse,
});

// REDUCER
const isGuestBannerVisible = (state = true, action) => {
    switch (action.type) {
        case TOGGLED_GUEST_BANNER:
            return action.isGuestBannerVisible;
        default:
            return state;
    }
};

// EXPORTED REDUCER
export default {
    isGuestBannerVisible,
};
