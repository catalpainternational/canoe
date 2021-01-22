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

import { MANIFESTV1_CACHE_NAME } from "ts/Constants";
import { ROUTES_FOR_REGISTRATION } from "js/urls";
import { buildAppelflapRoutes } from "js/RoutingAppelflap";

registerRoute(
    new RegExp(ROUTES_FOR_REGISTRATION.media),
    new CacheFirst({
        cacheName: "media-cache",
        plugins: [new RangeRequestsPlugin()],
    })
);

registerRoute(
    new RegExp(ROUTES_FOR_REGISTRATION.images),
    new CacheFirst({
        cacheName: "images-cache",
    })
);

registerRoute(
    new RegExp(ROUTES_FOR_REGISTRATION.pagesv2),
    new CacheFirst({
        cacheName: "pages-cache",
    })
);

registerRoute(
    new RegExp(ROUTES_FOR_REGISTRATION.manifest),
    new StaleWhileRevalidate({
        cacheName: MANIFESTV1_CACHE_NAME,
    })
);

registerRoute(new RegExp(ROUTES_FOR_REGISTRATION.tokenAuth), new NetworkOnly());
registerRoute(new RegExp(ROUTES_FOR_REGISTRATION.tokenAuth), new NetworkOnly(), "POST");

registerRoute(new RegExp(ROUTES_FOR_REGISTRATION.pagePreviewv2), new NetworkOnly());

registerRoute(new RegExp(ROUTES_FOR_REGISTRATION.actions), new NetworkOnly());
registerRoute(new RegExp(ROUTES_FOR_REGISTRATION.actions), new NetworkOnly(), "POST");

registerRoute(new RegExp(ROUTES_FOR_REGISTRATION.subscribe), new NetworkOnly());
registerRoute(new RegExp(ROUTES_FOR_REGISTRATION.subscribe), new NetworkOnly(), "POST");

// Set up routes to Appelflap, if Canoe is not hosted by Appelflap this does nothing
buildAppelflapRoutes().forEach((routeDef) => {
    registerRoute(new RegExp(routeDef[0]), new NetworkOnly(), routeDef[1]);
});

registerRoute(new RegExp(ROUTES_FOR_REGISTRATION.appelflapPKIsign), new NetworkOnly(), "POST");

// webpack-dev-server communicates over this endpoint. Without this clause, the
// service worker caches these requests and breaks webpack-dev-server.
registerRoute(new RegExp(ROUTES_FOR_REGISTRATION.socketInfo), new NetworkOnly());

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
