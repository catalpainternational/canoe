import json

from django.http import HttpResponse, HttpResponseForbidden, JsonResponse
from django.views.decorators.csrf import csrf_exempt

from rest_framework import exceptions
from rest_framework_jwt.authentication import JSONWebTokenAuthentication

from catalpa_django_apps.user_actions.models import UserAction

token_auth = JSONWebTokenAuthentication()


@csrf_exempt
def completions(request):
    try:
        auth = token_auth.authenticate(request)
    except exceptions.AuthenticationFailed:
        return HttpResponseForbidden()

    if auth is None:
        return HttpResponseForbidden()

    user = auth[0]

    if request.content_type and request.content_type != "application/json":
        return HttpResponse(status=400)

    if request.method == "POST":
        return post_completion(request, user)
    elif request.method == "GET":
        return get_completions(request, user)
    else:
        return HttpResponse(status=405)


def post_completion(request, user):
    data = json.loads(request.body)
    created = data.pop("date")
    uuid = data.pop("uuid")

    UserAction.create_action(user, created=created, action_uuid=uuid, data=data)
    return HttpResponse(status=201)


def get_completions(request, user):
    actions = UserAction.latest_actions(
        user,
        data_filter={"type": "completion"},
        data_distinct=["course", "lesson", "section"],
    ).values("action_uuid", "created", "data")

    actions_list = []

    for action in actions:
        data = action["data"]
        data["date"] = action["created"].isoformat()
        data["uuid"] = action["action_uuid"].hex
        data["type"] = action["data"].pop("type")
        actions_list.append(data)

    return JsonResponse(actions_list, safe=False)
