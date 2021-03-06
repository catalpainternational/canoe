import { registerRoute } from "workbox-routing/registerRoute.mjs";

import { setCatchHandler } from "workbox-routing/setCatchHandler.mjs";
import { CacheFirst } from "workbox-strategies/CacheFirst.mjs";
import { CacheAnyOrFetchOnly } from "js/CacheAnyOrFetchOnly.mjs";

import { RangeRequestsPlugin } from "workbox-range-requests";
import { ExpirationPlugin } from "workbox-expiration";

import * as googleAnalytics from "workbox-google-analytics";

googleAnalytics.initialize();

import { precacheAndRoute, matchPrecache } from "workbox-precaching";

precacheAndRoute(self.__WB_MANIFEST);
self.__WB_DISABLE_DEV_LOGS = true;

import { ROUTES_FOR_REGISTRATION } from "js/urls";

const cardImageFallbackUrl = (url) => {
    if (url.match(/cardImageFallback=([^&]*)/)[1]) {
        return matchPrecache(url.match(/cardImageFallback=([^&]*)/)[1]);
    };
    return null;
};

const cardFallbackPlugin = {
    fetchDidSucceed: async ({request, response, event, state}) => {
        if (response.status === 404) {
            return cardImageFallbackUrl(response.url);
        }
        return response;
    },
    handlerDidError: async ({request, event, error, state}) => {
        return cardImageFallbackUrl(response.url);
    },
    cacheKeyWillBeUsed: async ({request, mode, params, event, state}) => {
        // `request` is the `Request` object that would otherwise be used as the cache key.
        // `mode` is either 'read' or 'write'.
        // Return either a string, or a `Request` whose `url` property will be used as the cache key.
        // Returning the original `request` will make this a no-op.

        // we split the query off the path here to avoid workbox caching the same image twice
        const path = request.url.split('?')[0];
        return path;
    },
}

registerRoute(
    function(request) {
        return request.url.searchParams && request.url.searchParams.has('cardImageFallback')
    },
    new CacheFirst({
        cacheName: "card-images-cache",
        matchOptions: { ignoreSearch: true },
        plugins: [
            cardFallbackPlugin,
            new ExpirationPlugin({
                maxAgeSeconds: 5 * 365 * 24 * 60 * 60,
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

registerRoute(new RegExp(ROUTES_FOR_REGISTRATION.images), new CacheAnyOrFetchOnly());
registerRoute(
    new RegExp(ROUTES_FOR_REGISTRATION.media),
    new CacheAnyOrFetchOnly({
        plugins: [new RangeRequestsPlugin()],
    })
);

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
