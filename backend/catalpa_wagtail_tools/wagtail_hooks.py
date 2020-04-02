from wagtail.core import hooks
from .handlers import FullUrlImageEmbedHandler


@hooks.register("register_rich_text_features")
def register_embed_handler(features):
    features.register_embed_type(FullUrlImageEmbedHandler)
