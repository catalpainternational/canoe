from django.urls import path
from .views import completions

urlpatterns = [path("completions", completions)]
