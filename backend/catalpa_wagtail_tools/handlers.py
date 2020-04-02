from django.core.exceptions import ObjectDoesNotExist
from django.conf import settings
from django.utils.html import escape

from wagtail.images.rich_text import ImageEmbedHandler
from wagtail.images.formats import get_image_format
from wagtail.images.shortcuts import get_rendition_or_not_found


class FullUrlImageEmbedHandler(ImageEmbedHandler):
    """
    Extend the wagtail ImageEmbedHandler to use a full absolute url for the images
    This is a temporary solution that relies upon adding BACKEND_URL into the settings
    """

    @classmethod
    def expand_db_attributes(cls, attrs):
        """ overrides the base expand_db_attributes to ensure absolute urls are used """
        try:
            image = cls.get_instance(attrs)
        except ObjectDoesNotExist:
            return '<img alt="">'

        image_format = get_image_format(attrs["format"])
        return absolute_image_to_html(image_format, image, attrs.get("alt", ""))


def absolute_image_to_html(image_format, image, alt_text, extra_attributes=None):
    """
    Copied from wagtail.images.formats.Format.image_to_html
    adds in the backend url to the src
    """

    if extra_attributes is None:
        extra_attributes = {}
    rendition = get_rendition_or_not_found(image, image_format.filter_spec)

    extra_attributes["alt"] = escape(alt_text)
    if image_format.classnames:
        extra_attributes["class"] = "%s" % escape(image_format.classnames)

    # EDITED FROM WAGTAIL SRC

    # Workbox only caches crossorigin images.
    extra_attributes["crossorigin"] = "anonymous"
    extra_attributes["src"] = settings.BACKEND_URL + rendition.attrs_dict["src"]
    # END EDITED FROM WAGTAIL SRC

    return rendition.img_tag(extra_attributes)
