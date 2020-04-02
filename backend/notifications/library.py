from datetime import datetime, timedelta, timezone
import json

from push_notifications.models import WebPushDevice
from push_notifications.webpush import WebPushError

from .models import SentNotification


def _webpushdevice_invalid(errmsg):
    """Check a web push device send exception message to see if the device is no longer
    valid and should be deleted.

    Note: During testing '403' errors were rare but when they did happen they
    never went away for a particular device registration, so if we receive one
    we will delete the registration."""
    errmsg_is_NotRegistered = "NotRegistered" in errmsg
    errmsg_is_UnauthorizedRegistration = "UnauthorizedRegistration" in errmsg
    errmsg_is_fourhundred_error = [
        errc for errc in ["410", "404", "401", "403"] if errc in errmsg
    ]
    return (
        # `black` cuts this line on the operator. `flake8` disagrees.
        errmsg_is_NotRegistered
        or errmsg_is_UnauthorizedRegistration  # noqa: W503
        or errmsg_is_fourhundred_error  # noqa: W503
    )


def _send_message(user, title, message, **kwargs):
    """Send message to subscribed devices for a specific user."""
    devices = WebPushDevice.objects.filter(user__id=user.id, active=True)
    for device in devices:
        try:
            msg = json.dumps(
                {"title": title, "message": message, "data": kwargs},
                separators=(",", ":"),
            )
            device.send_message(msg)
            SentNotification.objects.create(
                user=user, title=title, message=message, type=kwargs["type"]
            )
        except WebPushError as ex:
            if _webpushdevice_invalid(str(ex)):
                device.delete()


def _start_datetime_at_midnight(a_datetime):
    return datetime(
        year=a_datetime.year,
        month=a_datetime.month,
        day=a_datetime.day,
        tzinfo=timezone.utc,
    )


def _get_day_start_and_end_from_n_days_ago(n_days):
    now = datetime.now(timezone.utc)
    num_of_days_ago = now - timedelta(days=n_days)
    num_of_days_ago_minus_one = now - timedelta(days=n_days - 1)

    midnight_num_days_ago = _start_datetime_at_midnight(num_of_days_ago)
    midnight_num_days_ago_minus_one = _start_datetime_at_midnight(
        num_of_days_ago_minus_one
    )

    return midnight_num_days_ago, midnight_num_days_ago_minus_one


def get_users_who(gives_a_user_queryset, n_days_ago):
    midnight_num_days_ago, midnight_num_days_ago_minus_one = _get_day_start_and_end_from_n_days_ago(
        n_days=n_days_ago
    )

    matching_users = gives_a_user_queryset(
        starts_from=midnight_num_days_ago, ends_at=midnight_num_days_ago_minus_one
    )

    return matching_users


def notify_a_user(user, notification):
    _send_message(
        user=user,
        title=notification.title,
        message=notification.message,
        notification_icon=notification.icon_file,
        type=notification.type,
    )


class Notification:
    def __init__(self, title="", message="", icon_file=None, message_type="TEST"):
        if type(title) != str or type(message) != str:
            raise ValueError("Notification 'title' and 'message' must be strings.")

        self.title = title
        self.message = message
        self.icon_file = icon_file
        self.type = message_type

