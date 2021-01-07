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

import { BACKEND_BASE_URL, MANIFEST_BACKEND_BASE_URL } from "js/urls";
import { MANIFEST_CACHE_NAME, MANIFESTV2_CACHE_NAME } from "ts/Constants";

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
        cacheName: MANIFEST_CACHE_NAME,
    })
);

registerRoute(
    new RegExp(`${MANIFEST_BACKEND_BASE_URL}/manifest/0.0.1`),
    new StaleWhileRevalidate({
        cacheName: MANIFESTV2_CACHE_NAME,
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
