from wagtail.core.models import Page
from wagtail_headless_preview.models import HeadlessPreviewMixin


class APIPreviewablePage(HeadlessPreviewMixin, Page):
    class Meta:
        abstract = True

    def get_url_parts(self, request=None):
        """ override the path part of the url to use has routing with the page id """
        parts = super().get_url_parts(request)
        if parts is None:
            return None
        path = "/#{}".format(self.pk)
        return (parts[0], parts[1], path)
