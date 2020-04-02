import hashlib
import json

from django.contrib.auth.models import User, Group
from django.http import HttpResponseForbidden, JsonResponse
from django.urls import reverse
from django.views.decorators.http import etag

from rest_framework import exceptions
from rest_framework_jwt.authentication import JSONWebTokenAuthentication
from rest_framework_jwt.views import obtain_jwt_token
from wagtail.core.models import Page, Site
from catalpa_wagtail_tools.richtext_parsing import get_lessons_image_urls
from elearning_content.models import LessonPage


token_auth = JSONWebTokenAuthentication()


def _get_published_images():
    mobile_image_urls = []

    for lesson in LessonPage.objects.all():
        mobile_image_urls += get_lessons_image_urls(lesson)

    return mobile_image_urls


def get_pages_hash_contribution(page):
    """ returns the page's contribution to the hash """
    return "{}{}".format(page["last_published_at"], page["path"]).encode("utf-8")


def _parent_page_path(page):
    """ returns the path of a page's parent """
    return page["path"][:-4]


def create_site_tree(wagtail_pages):
    if len(wagtail_pages) == 0:
        return {}

    tree = {}
    for page in wagtail_pages:
        parent_path = page["path"][:-4]
        if parent_path in tree:
            tree[parent_path].append(page)
        else:
            tree[parent_path] = [page]

    return tree


def create_site_pages_hashes(page, site_tree):
    """
    Builds md5 digests so that page urls vary when any child page is added,
    deleted, moved, or edited.

    Traverses the site tree depth-first. Parents create their hashes and update
    them with their children's hashes.
    """
    pages_path = page["path"]

    pages_hash_contribution = get_pages_hash_contribution(page)

    page["hash"] = hashlib.md5()
    page["hash"].update(pages_hash_contribution)

    pages_children = site_tree.get(pages_path, [])

    for a_child in pages_children:
        a_childs_hash_contribution = create_site_pages_hashes(a_child, site_tree)
        page["hash"].update(a_childs_hash_contribution)

    return page["hash"].hexdigest().encode("utf-8")


def _get_site_pages(site):
    """ returns a list of pages under this site decorated with revision uniqueness hashes """
    # get a single query return of page ids including path and last publish information only
    site_pages = (
        site.root_page.get_descendants(inclusive=True)
        .live()
        .values("path", "pk", "last_published_at")
        .order_by("path")
    )
    site_tree = create_site_tree(site_pages)

    root_page = site_pages[0]
    create_site_pages_hashes(root_page, site_tree)

    return site_pages


def _get_page_url(pk, page_hash):
    """ returns a page url with a hash appended for uniqueness """
    return "{url}?{etag}".format(
        url=reverse("wagtailapi:pages:detail", kwargs={"pk": pk}),
        etag=page_hash.hexdigest(),
    )


def _pages_etag(request):
    """ returns the etag hash of the request's site root page """
    site_pages = _get_site_pages(request.site)
    return site_pages[0]["hash"].hexdigest()


@etag(_pages_etag)
def manifest(request):
    try:
        auth = token_auth.authenticate(request)
    except exceptions.AuthenticationFailed:
        return HttpResponseForbidden()

    if auth is None:
        return HttpResponseForbidden()

    site_pages = _get_site_pages(request.site)

    root = site_pages[0]

    data = dict(
        home=_get_page_url(root["pk"], root["hash"]),
        pages={
            page["pk"]: _get_page_url(page["pk"], page["hash"])
            for page in site_pages
        },
        images=_get_published_images(),
    )

    return JsonResponse(data)


def obtain_jwt_token_and_user_information(request):
    if request.content_type != "application/json" or request.method != "POST":
        return HttpResponseForbidden()

    request_body = request.body
    jwt_token_response = obtain_jwt_token(request)

    if jwt_token_response.status_code in [400, 404]:
        return jwt_token_response

    request_body = json.loads(request_body)
    username = request_body.get("username", "")
    user = User.objects.get(username=username)
    groups = [
        group.name
        for group in Group.objects.filter(user=user)
        if group.name not in ["Editors", "Moderators"]
    ]

    jwt_token_response.data.update(
        {"username": username, "userId": user.id, "groups": groups}
    )

    return jwt_token_response
