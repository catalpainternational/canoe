// environment configuration is things related to where
// the code is running, on a dev machine or a deployment

module.exports = {
    GA_TAG: false,
    API_BASE_URL: "http://localhost:8005",
    SKIP_SW: false,
    DONT_SHOW_COMPLETIONS_AFTER: "2020-2-15",
    APPLICATION_SERVER_KEY: "",
    WEBPACK_CONFIG: {
        devServer: {
            port: 8085,
        },
    },
    GUEST_USERNAME: "Guest",
    CSRF_COOKIE_NAME: 'csrftoken',
};
