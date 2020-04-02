import json
import pytest
import datetime

from django.contrib.auth.models import User
from django.test import TestCase, RequestFactory

from rest_framework_jwt.settings import api_settings

from .views import manifest
from .models import HomePage, CoursePage, LessonPage
from wagtail.core.models import Site, Page


jwt_payload_handler = api_settings.JWT_PAYLOAD_HANDLER
jwt_encode_handler = api_settings.JWT_ENCODE_HANDLER


def get_auth_headers(user):
    payload = jwt_payload_handler(user)
    token = jwt_encode_handler(payload)
    return dict(
        HTTP_AUTHORIZATION="{0} {1}".format(api_settings.JWT_AUTH_HEADER_PREFIX, token)
    )


class ManifestApiTests(TestCase):
    """ Test the api that returns the site manifest """

    def setUp(self):
        # Every test needs access to the request factory.
        self.factory = RequestFactory()
        self.user = User.objects.create_user(
            username="jacob", email="jacob@…", password="top_secret"
        )
        self.user2 = User.objects.create_user(
            username="joseph", email="joseph@…", password="top_secret"
        )

        # home page
        page = Page.objects.first()
        home = page.add_child(
            instance=HomePage(
                title="Home", slug="test", last_published_at=datetime.datetime.now()
            )
        )

        # create the site
        self.site = Site.objects.create(root_page=home)

        self.courses = []
        self.lessons = []
        # create some child pages
        for i in range(0, 3):
            course = home.add_child(
                instance=CoursePage(
                    title="Course - {}".format(i + 1),
                    slug="course{}".format(i + 1),
                    last_published_at=datetime.datetime.now(),
                )
            )
            self.courses.append(course)
            for j in range(0, 3):
                lesson = course.add_child(
                    instance=LessonPage(
                        title="Lesson - {}".format(j + 1),
                        content_duration=5,
                        objective_duration=5,
                        test_duration=5,
                        last_published_at=datetime.datetime.now(),
                    )
                )
                self.lessons.append(lesson)

    @pytest.mark.django_db
    def test_manifest_api_get_requires_authentication(self):
        # Create an instance of a GET request.
        request = self.factory.get("/anythingatall")
        request.site = self.site

        response = manifest(request)
        self.assertEqual(response.status_code, 403)

    @pytest.mark.django_db
    def test_manifest_api_get_return(self):
        # Create an instance of a GET request.
        request = self.factory.get("/anythingatall", **get_auth_headers(self.user))
        request.site = self.site

        response = manifest(request)
        self.assertEqual(response.status_code, 200)

    @pytest.mark.django_db
    def test_manifest_etag(self):
        # get the initial response to record the etag
        request = self.factory.get("/anythingatall", **get_auth_headers(self.user))
        request.site = self.site
        response = manifest(request)
        self.assertEqual(response.status_code, 200)
        initial_data = json.loads(response.content)

        # read etag and send an if-none-match expectiong a not-modified
        etag = response["Etag"]
        request = self.factory.get(
            "/anythingatall", **get_auth_headers(self.user), HTTP_IF_NONE_MATCH=etag
        )
        request.site = self.site
        response = manifest(request)
        self.assertEqual(response.status_code, 304)

        # update a single lesson
        lessonpage = self.site.root_page.get_children()[0].get_children()[0].specific
        lessonpage.title = "NewTitle"
        revision = lessonpage.save_revision()
        revision.publish()

        # request again expecting a 200 and new content
        request = self.factory.get(
            "/anythingatall", **get_auth_headers(self.user), HTTP_IF_NONE_MATCH=etag
        )
        request.site = self.site
        response = manifest(request)
        self.assertEqual(response.status_code, 200)
        changed_data = json.loads(response.content)

        # verify manifest contains the expected changes
        self.assertNotEqual(changed_data["home"], initial_data["home"])
        changed_page_ids = [
            int(c[0])
            for c in filter(
                lambda p: p[1] != initial_data["pages"][p[0]],
                changed_data["pages"].items(),
            )
        ]
        self.assertIn(lessonpage.pk, changed_page_ids)
        self.assertIn(lessonpage.get_parent().pk, changed_page_ids)

    @pytest.mark.django_db
    def test_manifest_unpublished_page(self):
        """ the manifest should not return entries for pages without a live revision """
        request = self.factory.get("/anythingatall", **get_auth_headers(self.user))
        request.site = self.site
        response = manifest(request)
        initial_data = json.loads(response.content)

        self.courses[0].get_children().unpublish()

        request = self.factory.get("/anythingatall", **get_auth_headers(self.user))
        request.site = self.site
        response = manifest(request)
        altered_data = json.loads(response.content)
        self.assertNotEqual(len(initial_data["pages"]), len(altered_data["pages"]))
