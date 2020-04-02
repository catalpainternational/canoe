from html.parser import HTMLParser

from wagtail.images.models import Rendition

from .blocks import ContentBlock

class _EmbedHTMLParser(HTMLParser):
    """ Extend the standard html parser to simply store all details from embed tags """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.embeds = []

    def handle_starttag(self, tag, attrs):
        if tag == "embed":
            self.embeds.append(attrs)


def _is_embed_video(embed_attrs):
    """ embed tags in wagtail richtext are video if they have an attribute embedtype=media """
    return embed_attrs["embedtype"] == "media"


def _is_the_embed_an_image(embed):
    return embed["embedtype"] == "image"


def _get_embeds(richtext):
    """ return a list of dicts, each representing one embed in the richtext """
    parser = _EmbedHTMLParser()
    parser.feed(richtext)
    return list(map(dict, parser.embeds))


def _get_embedded_images_ids(embeds):
    image_ids = set()
    for embed in embeds:
        if _is_the_embed_an_image(embed):
            image_ids.add(embed["id"])
    return image_ids


def get_lessons_image_urls(page):
    if len(page.content_cards) == 0:
        return []

    image_ids = set()
    image_urls = []

    for content_card in page.content_cards:
        if not isinstance(content_card.block, ContentBlock):
            continue
        content_rich_text = content_card.value["content"].source
        embeds = _get_embeds(content_rich_text)
        embedded_images = _get_embedded_images_ids(embeds)
        image_ids = image_ids.union(embedded_images)

    for image_id in image_ids:
        image_renditions = Rendition.objects.filter(
            image_id=image_id, filter_spec="width-300"
        )

        if not image_renditions.exists():
            continue

        image_url = image_renditions[0].url
        image_urls.append(image_url)

    return image_urls
