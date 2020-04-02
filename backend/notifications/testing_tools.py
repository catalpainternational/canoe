import json
from unittest.mock import MagicMock

from django.contrib.auth.models import User
from push_notifications.models import WebPushDevice

def create_a_notifiable_user(username):
    a_user = User.objects.create(username=username)
    WebPushDevice.objects.create(user_id=a_user.id)
    return a_user


def set_up_notification_mocks(mock_wpd_objects):
    received_notifications = []
    mock_web_push_device = MagicMock()
    mock_web_push_device.send_message = lambda msg: received_notifications.append(
        json.loads(msg)
    )
    mock_wpd_objects.filter.return_value = [mock_web_push_device]
    return received_notifications


def check_a_notification_arrived(received_notifications):
    assert len(received_notifications) == 1


def check_no_notifications_arrived(received_notifications):
    assert len(received_notifications) == 0


def check_sent_and_received_match(sent, received):
    assert sent.title == received.get("title")
    assert sent.message == received.get("message")

