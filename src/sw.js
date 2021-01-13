import { registerRoute } from "workbox-routing/registerRoute.mjs";
import { setDefaultHandler } from "workbox-routing/setDefaultHandler.mjs";
import { CacheFirst } from "workbox-strategies/CacheFirst.mjs";
import { StaleWhileRevalidate } from "workbox-strategies/StaleWhileRevalidate.mjs";
import { NetworkOnly } from "workbox-strategies/NetworkOnly.mjs";
import { RangeRequestsPlugin } from "workbox-range-requests";

import * as googleAnalytics from "workbox-google-analytics";

googleAnalytics.initialize();

import { precacheAndRoute } from "workbox-precaching";

precacheAndRoute(self.__WB_MANIFEST);

import { BACKEND_BASE_URL } from "./js/urls";
import { AppelflapPortNo, APPELFLAPCOMMANDS, AF_LOCALHOSTURI } from "./js/RoutingAppelflap";

registerRoute(
    new RegExp(`${BACKEND_BASE_URL}/media/media/.+`),
    new CacheFirst({
        cacheName: "media-cache",
        plugins: [new RangeRequestsPlugin()],
    })
);

registerRoute(
    new RegExp(`${BACKEND_BASE_URL}/media/images/.+`),
    new CacheFirst({
        cacheName: "images-cache",
    })
);

registerRoute(
    new RegExp(`${BACKEND_BASE_URL}/api/v2/pages/.*`),
    new CacheFirst({
        cacheName: "pages-cache",
    })
);

registerRoute(
    new RegExp(`${BACKEND_BASE_URL}/manifest`),
    new StaleWhileRevalidate({
        cacheName: "manifest-cache",
    })
);

registerRoute(new RegExp(`${BACKEND_BASE_URL}/token-auth/`), new NetworkOnly());

registerRoute(new RegExp(`${BACKEND_BASE_URL}/token-auth/`), new NetworkOnly(), "POST");

registerRoute(new RegExp(`${BACKEND_BASE_URL}/api/v2/page_preview`), new NetworkOnly());

registerRoute(new RegExp(`${BACKEND_BASE_URL}/progress/actions`), new NetworkOnly());

registerRoute(new RegExp(`${BACKEND_BASE_URL}/progress/actions`), new NetworkOnly(), "POST");

registerRoute(new RegExp(`${BACKEND_BASE_URL}/notifications/subscribe*`), new NetworkOnly());

registerRoute(
    new RegExp(`${BACKEND_BASE_URL}/notifications/subscribe*`),
    new NetworkOnly(),
    "POST"
);

// Set up routes to Appelflap, if Canoe is not hosted by Appelflap this does nothing
const initialiseAppelflapRoutes = () => {
    const portNo = AppelflapPortNo();

    if (portNo > -1) {
        Object.keys(APPELFLAPCOMMANDS).forEach((commandName) => {
            const command = APPELFLAPCOMMANDS[commandName];
            // Port number range is 2^10 to 2^16-1 inclusive - 1024 to 65535
            const portRange = "(102[4-9]|10[3-9]\d|1[1-9]\d{2}|[2-9]\d{3}|[1-5]\d{4}|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5])";
            const route = `${AF_LOCALHOSTURI}:${portRange}/${command.commandPath}`.replaceAll("/", "\\/");
            registerRoute(RegExp(route), new NetworkOnly(), command.method);
        });
    }
};
initialiseAppelflapRoutes();

// webpack-dev-server communicates over this endpoint. Without this clause, the
// service worker caches these requests and breaks webpack-dev-server.
registerRoute(new RegExp(`/sockjs-node/info`), new NetworkOnly());

setDefaultHandler(new CacheFirst());

const getNotificationTitleMessageAndTag = (eventData) => {
    let title = null;
    let message = null;
    let messageTag = null;
    let type = null;

    try {
        const responseJSON = eventData.json();
        title = responseJSON.title;
        message = responseJSON.message;
        messageTag = responseJSON.tag;
        type = responseJSON.data.type;
    } catch (err) {
        title = "";
        message = eventData.text();
        messageTag = "";
        type = "";
    }

    return { title, message, messageTag, type };
};

self.addEventListener("push", async (event) => {
    const { title, message, messageTag, type } = getNotificationTitleMessageAndTag(event.data);
    const options = {
        body: message,
        icon: "/img/icon_120.png",
        tag: messageTag,
    };
    event.waitUntil(self.registration.showNotification(title, options));

    const allClients = await self.clients.matchAll({
        includeUncontrolled: true,
    });

    allClients.forEach((client) => {
        client.postMessage(`${type}`);
    });
});

self.addEventListener("notificationclick", function (event) {
    event.notification.close();
});

self.addEventListener("install", () => {
    self.skipWaiting();
});

self.addEventListener("activate", () => {
    self.clients.claim();
});
