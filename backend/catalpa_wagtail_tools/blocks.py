from django.conf import settings
from django.forms.utils import flatatt
from django.utils.html import format_html, format_html_join, mark_safe

from wagtail.core import blocks
from wagtail.core.templatetags.wagtailcore_tags import richtext

from wagtailmedia.blocks import AbstractMediaChooserBlock


class TitleDescriptionBlock(blocks.StructBlock):
    title = blocks.CharBlock(max_length=32)
    description = blocks.TextBlock(max_length=512)


class ContentBlock(blocks.StructBlock):
    content = blocks.RichTextBlock()

    def for_api(self, value):
        # add a tag type so the frontend know to render the content as raw html
        return dict(tag='raw', content=richtext(value["content"].source))


class AnswerBlock(blocks.StructBlock):
    text = blocks.CharBlock(max_length=64)
    correct = blocks.BooleanBlock(default=False, required=False)


class SingleChoiceBlock(blocks.StructBlock):
    question = blocks.CharBlock(max_length=256)
    answers = blocks.ListBlock(AnswerBlock())


_audio_tag_html = """
<div>
    <audio controls>
        {0}
        Your browser does not support the audio element.
    </audio>
</div>
"""

_video_tag_html = """
<div>
<video width="320" height="240" controls>
    {0}
    Your browser does not support the video tag.
</video>
</div>
"""


class MediaBlock(AbstractMediaChooserBlock):
    def render_basic(self, value, context=None):
        if not value:
            return ""

        if "video" in value.type:
            player_code = _video_tag_html
        else:
            player_code = _audio_tag_html

        tag_attributes = [
            [
                mark_safe(
                    f' src="{settings.BACKEND_URL}{source.get("src")}" type="{source.get("type")}"'
                )
            ]
            for source in value.sources
        ]

        formatted_source_tag = format_html_join("\n", "<source{0}>", tag_attributes)
        formatted_audio_or_video_tag = format_html(player_code, formatted_source_tag)
        return formatted_audio_or_video_tag

    def for_api(self, value):
        # in the api just return the data needed, and the tag type, letting the frontend code produce the html
        return dict(tag='media', sources=value.sources, media_type=value.type)
