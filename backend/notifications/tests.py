from unittest.mock import patch

from django.test import TestCase
from notifications.library import Notification, notify_a_user
from notifications.testing_tools import (
    create_a_notifiable_user,
    set_up_notification_mocks,
    check_a_notification_arrived,
    check_sent_and_received_match,
)


class CoreNotificationTests(TestCase):
    def setUp(self):
        self.a_user = create_a_notifiable_user(username="Olgeta")

    @patch("push_notifications.models.WebPushDevice.objects")
    def test_notify_a_user(self, mock_WebPushDevice_objects):
        received_notifications = set_up_notification_mocks(mock_WebPushDevice_objects)

        notification_to_send = Notification(title="test", message="a message")
        notify_a_user(user=self.a_user, notification=notification_to_send)

        check_a_notification_arrived(received_notifications)
        check_sent_and_received_match(notification_to_send, received_notifications[0])
