from importlib import import_module

from django.conf import settings
from django_rq import job


def _get_module_and_file_and_function_name(a_function_path):
    path_pieces = a_function_path.split(".")
    a_function_name = path_pieces.pop()
    a_file_name = path_pieces.pop()
    a_module_path = ".".join(path_pieces)
    return a_module_path, a_file_name, a_function_name


@job
def send_notifications():
    for a_notification_function_path in settings.NOTIFICATION_FUNCTIONS:
        (
            a_module_path,
            a_file_name,
            a_notification_function_name,
        ) = _get_module_and_file_and_function_name(a_notification_function_path)

        try:
            notifications_file = import_module(f".{a_file_name}", a_module_path)
        except ModuleNotFoundError:
            continue
        else:
            a_notification_function = getattr(
                notifications_file, a_notification_function_name
            )
            a_notification_function()
