from django.core.management.base import BaseCommand, CommandError
from wagtail.core.models import Site

class Command(BaseCommand):
    help = '''updates a site defined by hostname from_hostname to hostname to_hostname'''

    def add_arguments(self, parser):
        parser.add_argument('from_hostname')
        parser.add_argument('to_hostname')

    def handle(self, *args, **options):
        site = Site.objects.get(hostname=options['from_hostname'])
        site.hostname = options['to_hostname']
        site.save()
