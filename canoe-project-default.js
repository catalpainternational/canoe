// project configuration is things related to the project
// canoe is being used in, i.e. Olgeta or Asteroid
// site name - branding - webpack aliases

const path = require("path");

module.exports = {
    WEBPACK_CONFIG: {
        resolve: {
            alias: {
                // OverrideImages: path.resolve(__dirname, "canoe-overrides", "img"),
            }
        }
    },
    SITE_NAME: "Canoe",
    SITE_SHORT_NAME: "Canoe",
    SITE_DESCRIPTION: "An online education platform",
    FAVICON_PATH: "./src/favicon.svg",
    // If true REQUIRE_LOGIN will always redirect any user who does not have a login to the login page
    // unless they have a manifest cache in place already
    REQUIRE_LOGIN: false
};
