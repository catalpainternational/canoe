import json
import pytest

from django.contrib.auth.models import AnonymousUser, User
from django.test import TestCase, RequestFactory

from rest_framework_jwt.settings import api_settings

from catalpa_django_apps.user_actions.models import UserAction
from .views import completions


jwt_payload_handler = api_settings.JWT_PAYLOAD_HANDLER
jwt_encode_handler = api_settings.JWT_ENCODE_HANDLER


def get_auth_headers(user):
    payload = jwt_payload_handler(user)
    token = jwt_encode_handler(payload)
    return dict(
        HTTP_AUTHORIZATION="{0} {1}".format(api_settings.JWT_AUTH_HEADER_PREFIX, token)
    )


class CompletionsApiTests(TestCase):
    """ Test the api that sets and gets completions """

    def setUp(self):
        # Every test needs access to the request factory.
        self.factory = RequestFactory()
        self.user = User.objects.create_user(
            username="jacob", email="jacob@…", password="top_secret"
        )
        self.user2 = User.objects.create_user(
            username="joseph", email="joseph@…", password="top_secret"
        )

    @pytest.mark.django_db
    def test_completions_api_get_requires_authentication(self):
        # Create an instance of a GET request.
        request = self.factory.get("/anythingatall")

        response = completions(request)
        self.assertEqual(response.status_code, 403)

    @pytest.mark.django_db
    def test_completions_api_get_return(self):
        # create user actions
        UserAction.create_action(
            self.user, dict(type="completion", course=1, lesson=1, section=1)
        )
        UserAction.create_action(
            self.user, dict(type="completion", course=1, lesson=1, section=2)
        )
        UserAction.create_action(
            self.user, dict(type="completion", course=1, lesson=1, section=3)
        )
        UserAction.create_action(
            self.user, dict(type="not completion", content_identifier="hello")
        )
        UserAction.create_action(
            self.user2, dict(type="completion", content_identifier="hello")
        )

        # Create an instance of a GET request.
        request = self.factory.get("/anythingatall", **get_auth_headers(self.user))

        response = completions(request)
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertEqual(len(data), 3)

    @pytest.mark.django_db
    def test_completions_api_post_requires_authentication(self):
        request = self.factory.post("/anythingatall")
        response = completions(request)
        self.assertEqual(response.status_code, 403)

    @pytest.mark.django_db
    def test_completions_api_post(self):

        action = dict(
            course="hello",
            lesson="world",
            section="bob",
            uuid="d8d2f45a-7a84-44f0-8033-87ea709f84bd",
            type="completion",
            date="2019/12/12",
        )
        request = self.factory.post(
            "/anythingatall",
            action,
            content_type="application/json",
            **get_auth_headers(self.user)
        )

        response = completions(request)
        self.assertEqual(response.status_code, 201)

        actions = UserAction.objects.all()
        self.assertEqual(actions.count(), 1)
