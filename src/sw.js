import { registerRoute } from "workbox-routing/registerRoute.mjs";
import { setDefaultHandler } from "workbox-routing/setDefaultHandler.mjs";
import { setCatchHandler } from "workbox-routing/setCatchHandler.mjs";
import { CacheFirst } from "workbox-strategies/CacheFirst.mjs";
import { StaleWhileRevalidate } from "workbox-strategies/StaleWhileRevalidate.mjs";
import { NetworkOnly } from "workbox-strategies/NetworkOnly.mjs";
import { RangeRequestsPlugin } from "workbox-range-requests";
import { ExpirationPlugin } from "workbox-expiration";

import * as googleAnalytics from "workbox-google-analytics";

googleAnalytics.initialize();

import { precacheAndRoute, matchPrecache } from "workbox-precaching";

precacheAndRoute(self.__WB_MANIFEST);
self.__WB_DISABLE_DEV_LOGS = true;

import { BACKEND_BASE_URL } from "./js/urls";

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

const cardImageFallbackUrl = (url) => {
    console.log('cardImageFallbackUrl requested');
    if (url.match(/cardImageFallback=([^&]*)/)[1]) {
        return matchPrecache(url.match(/cardImageFallback=([^&]*)/)[1]);
    };
    return null;
};


const cardFallbackPlugin = {
    fetchDidFail: async ({originalRequest, request, error, event, state}) => {
        return cardImageFallbackUrl(request.url);
    },
    fetchDidSucceed: async ({request, response, event, state}) => {
        if (response.status === 404) {
            return cardImageFallbackUrl(response.url);
        }
        return response;
    },
}

registerRoute(
    function(request) {
        return request.url.searchParams && request.url.searchParams.has('cardImageFallback')
    },
    new CacheFirst({
        cacheName: "card-images-cache",
        plugins: [
            cardFallbackPlugin,
            new ExpirationPlugin({
                maxEntries: 1,
                maxAgeSeconds: 30 * 24 * 60 * 60,
                purgeOnQuotaError: true,
            }),
        ],
    })
);

setCatchHandler(({url, event, params}) => {
    if (url.searchParams.has('cardImageFallback')) {
        return cardImageFallbackUrl(url.search);
   }
   return Response.error();
});

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
