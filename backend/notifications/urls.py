from django.urls import include, path

from push_notifications.api.rest_framework import WebPushDeviceAuthorizedViewSet
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r"subscribe", WebPushDeviceAuthorizedViewSet)

urlpatterns = [path("", include(router.urls))]
