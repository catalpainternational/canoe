import re

from django.utils.deprecation import MiddlewareMixin

from wagtail.core.sites import get_site_for_hostname

DEFAULT_PORTS = dict(http=80, https=443)

def get_referer_site(request):
    ''' gets the wagtail site from the referrer header '''

    referer = request.META.get('HTTP_REFERER', None)

    if referer is None:
        return None

    match = re.match(r"(?P<protocol>http[s]*):\/\/(?P<host>[\w\.]+)[:]?(?P<port>[\d]*)", request.META['HTTP_REFERER'])
    if not match:
        return None

    protocol = match.group('protocol')
    host = match.group('host')
    port = match.group('port') or DEFAULT_PORTS[protocol]
    return get_site_for_hostname(host, port)


class RefererSiteMiddleware(MiddlewareMixin):
    ''' overwrites the existing request site if one can be found from the referer header '''

    def process_request(self, request):
        """
        Set request.site to contain the Site object responsible for handling this request,
        according to hostname matching rules
        """
        request.site = get_referer_site(request) or request.site

