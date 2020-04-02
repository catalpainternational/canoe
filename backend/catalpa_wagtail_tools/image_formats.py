from django.utils.translation import ugettext_lazy as _
from wagtail.images.formats import (
    Format,
    register_image_format,
    unregister_image_format,
)

unregister_image_format(
    Format("fullwidth", _("Full width"), "richtext-image full-width", "width-800")
)
unregister_image_format(
    Format("left", _("Left-aligned"), "richtext-image left", "width-500")
)
unregister_image_format(
    Format("right", _("Right-aligned"), "richtext-image right", "width-500")
)

register_image_format(
    Format("mobile", _("Mobile"), "richtext-image mobile", "width-300")
)
