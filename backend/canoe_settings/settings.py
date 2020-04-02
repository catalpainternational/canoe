import os

CANOE_APPS = [
    # WAGTAIL
    "wagtail.api.v2",
    "wagtail.contrib.forms",
    "wagtail.contrib.redirects",
    "wagtail.embeds",
    "wagtail.sites",
    "wagtail.users",
    "wagtail.snippets",
    "wagtail.documents",
    "wagtail.images",
    "wagtail.search",
    "wagtail.admin",
    "wagtail.core",
    "modelcluster",
    "taggit",

    # THIRD-PARTY
    "corsheaders",
    "rest_framework",
    "wagtail_headless_preview",
    "push_notifications",
    "django_rq",
    "rqutils",
    "wagtailmedia",

    # CANOE
    "elearning_content",
    "student_progress",
    "catalpa_django_apps.user_actions",
    "notifications",
    "catalpa_wagtail_tools",
]

CORS_MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
]

CANOE_MIDDLEWARE = [
    "wagtail.core.middleware.SiteMiddleware",
    "catalpa_wagtail_tools.middleware.RefererSiteMiddleware",
    "wagtail.contrib.redirects.middleware.RedirectMiddleware",
]

# Don't add a trailing slash to Wagtail-served URLs
WAGTAIL_APPEND_SLASH = False

# django-cors-headers
CORS_ORIGIN_ALLOW_ALL = False

from corsheaders.defaults import default_headers

CORS_ALLOW_HEADERS = list(default_headers) + [
    'range', 'chrome-proxy'
]

JWT_AUTH = {
    # Tokens don't expire. As the docs say, "Without expiration verification,
    # JWTs will last forever meaning a leaked token could be used by an
    # attacker indefinitely".
    "JWT_VERIFY_EXPIRATION": False
}

BACKEND_URL = "http://localhost:8000"

RQ = {"JOB_CLASS": "rqutils.jobs.AcceptableFailedTTLJob", "ACCEPTABLE_FAILED_TTL": 300}

RQ_TEMPLATE = {
    "HOST": "localhost",
    "PORT": 6379,
    "DB": 0,
    "DEFAULT_TIMEOUT": 600,
    "DEFAULT_RESULT_TTL": 0,
}

RQ_QUEUEDEF = dict(
    highprio=dict(wpc=0.5),
    default=dict(wpc=1, nice=5),
    bulk=dict(wpc=0.5, nice=15, oom_adj=750),
)

RQ_QUEUES = {qname: RQ_TEMPLATE for qname in RQ_QUEUEDEF}

DO_TASKSCHEDULE = True

RQ_SCHEDULE = []

PUSH_NOTIFICATIONS_SETTINGS = {
    "WP_PRIVATE_KEY": "",  # os.path.join(BASE_DIR, "private_key.pem"),
    "WP_CLAIMS": {"sub": "mailto:sysops@catalpa.io"},
    "UPDATE_ON_DUPLICATE_REG_ID": True,
}

PUSH_PUBLIC_KEY = ""

NOTIFICATION_FUNCTIONS = [
]
