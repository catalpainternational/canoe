from django.urls import path, re_path, include
from django.views.decorators.clickjacking import xframe_options_exempt

from wagtail.admin import urls as wagtailadmin_urls
from wagtail.documents import urls as wagtaildocs_urls
from wagtail.core import urls as wagtail_urls
from wagtail.contrib.sitemaps.views import sitemap
from wagtail.admin import urls as wagtailadmin_urls

from catalpa_wagtail_tools.previewable_api import api_router
from .views import manifest, obtain_jwt_token_and_user_information

urlpatterns = [
    re_path(r"admin/", include(wagtailadmin_urls)),
    re_path(r"^api/v2/", api_router.urls),
    re_path(r"^documents/", include(wagtaildocs_urls)),
    re_path(r"^site/", include(wagtail_urls)),
    re_path(r"^sitemap\.xml$", sitemap),
    re_path(r"^token-auth/$", obtain_jwt_token_and_user_information),
    re_path(r"^manifest$", manifest),
]
