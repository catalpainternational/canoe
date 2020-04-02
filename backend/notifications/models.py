from django.contrib.auth.models import User
from django.db import models


class SentNotification(models.Model):
    user = models.ForeignKey(User, null=True, on_delete=models.CASCADE)
    title = models.TextField(null=False, blank=False)
    message = models.TextField(null=False, blank=False)
    type = models.CharField(null=False, blank=False, max_length=256)
    timestamp = models.DateTimeField(auto_now_add=True)
