from django.db import models
from django.http import JsonResponse

from wagtail.api import APIField
from wagtail.core.blocks import ChoiceBlock, RichTextBlock
from wagtail.core.models import Page
from wagtail.core.fields import RichTextField, StreamField
from wagtail.admin.edit_handlers import (
    FieldPanel,
    StreamFieldPanel,
    TabbedInterface,
    ObjectList,
)
from catalpa_wagtail_tools.blocks import (
    TitleDescriptionBlock,
    ContentBlock,
    MediaBlock,
    SingleChoiceBlock,
)
from catalpa_wagtail_tools.models import APIPreviewablePage


OBJECTIVE_BLOCKS = [
    ("title_description", TitleDescriptionBlock()),
]

CONTENT_BLOCKS = [("content", ContentBlock()), ("video", MediaBlock())]

TEST_BLOCKS = [
    ("single_choice", SingleChoiceBlock()),
]


class HomePage(APIPreviewablePage):
    subpage_types = ["CoursePage"]
    body = RichTextField(blank=True)

    api_fields = [APIField("title"), APIField("body"), APIField("courses")]

    content_panels = Page.content_panels + [FieldPanel("body")]

    def courses(self):
        return [
            dict(data=page.coursepage.data(), lessons=page.coursepage.lessons())
            for page in self.get_children().live()
        ]


# COURSE_COLOUR_CHOICES = map(lambda t: reversed(t), (
COURSE_COLOUR_CHOICES = map(
    lambda t: (t[0], "{} - {}".format(t[0], t[1])),
    (
        ("blue-1", "#04788E"),
        ("blue-2", "#00B8AD"),
        ("brown", "#744D4D"),
        ("gray-1", "#2A3942"),
        ("gray-2", "#3F525E"),
        ("gray-3", "#596973"),
        ("gray-4", "#82939E"),
        ("gray-5", "#A0AFB8"),
        ("gray-6", "#C9D6DE"),
        ("gray-7", "#C9D6DE"),
        ("gray-8", "#E8EEF1"),
        ("gray-9", "#F4F8FA"),
        ("gray-10", "#FAFDFF"),
        ("green-1", "#007B56"),
        ("green-2", "#10B584"),
        ("green-3", "#F4FFFC"),
        ("orange-1", "#F66400"),
        ("orange-2", "#F67C36"),
        ("pink-1", "#8A0079"),
        ("pink-2", "#C300AB"),
        ("purple", "#6F6CAC"),
        ("red-1", "#DE3011"),
        ("red-2", "#FF694D"),
        ("white", "#FFFFFF"),
    ),
)

COURSE_ICON_CHOICES = (
    ("financial", "financial"),
    ("leadership", "leadership"),
    ("digital", "digital"),
)


class CoursePage(APIPreviewablePage):
    parent_page_types = [HomePage]
    subpage_types = ["LessonPage"]
    colour = models.CharField(
        max_length=16, default="red-1", choices=COURSE_COLOUR_CHOICES
    )
    icon = models.CharField(
        max_length=16, default="financial", choices=COURSE_ICON_CHOICES
    )

    api_fields = [APIField("data"), APIField("lessons")]

    content_panels = Page.content_panels + [FieldPanel("colour"), FieldPanel("icon")]

    def data(self):
        return dict(
            id=self.pk,
            slug=self.slug,
            title=self.title,
            colour=self.colour,
            icon=self.icon,
            lessons_count=self.get_children().live().exclude(lessonpage__coming_soon=True).count(),
        )

    def lessons(self):
        return [page.lessonpage.data() for page in self.get_children().live()]


JOB_CHOICES = (
    ("business_owner", "Business Owner"),
    ("engineer", "Engineer"),
    ("builder", "Builder"),
    ("tourism_hospitality_retail_manager", "Tourism, Hospitality, and Retail Manager"),
    (
        "communications_and_marketing_specialist",
        "Communications and Marketing Specialist",
    ),
    ("banking_and_finance_associate", "Banking and Finance Associate"),
)
JOB_LOOKUP = dict(JOB_CHOICES)


class LessonPage(APIPreviewablePage):
    parent_page_types = [CoursePage]

    description = models.TextField(blank=True)
    long_description = models.TextField(blank=True)

    jobs = StreamField([("job", ChoiceBlock(choices=JOB_CHOICES))], blank=True)

    objective_title = models.CharField(max_length=128, default="Objective")
    objective_aim = models.TextField(
        blank=True, default="Discover what we're aiming to learn in this lesson"
    )
    objective_duration = models.PositiveSmallIntegerField(
        choices=((m, m) for m in range(5, 60, 5))
    )
    objective_cards = StreamField(OBJECTIVE_BLOCKS)

    content_title = models.CharField(max_length=128, default="Content")
    content_aim = models.TextField(
        blank=True, default="Start learning by digging deeper into the content"
    )
    content_duration = models.PositiveSmallIntegerField(
        choices=((m, m) for m in range(5, 60, 5))
    )
    content_cards = StreamField(CONTENT_BLOCKS)

    test_title = models.CharField(max_length=128, default="Test Knowledge")
    test_aim = models.TextField(
        blank=True,
        default="Take a quiz to test your knowledge and finalise this lesson",
    )
    test_duration = models.PositiveSmallIntegerField(
        choices=((m, m) for m in range(5, 60, 5))
    )
    test_cards = StreamField(TEST_BLOCKS)

    coming_soon = models.BooleanField(
        default=False,
        help_text="""
        Publish this page as "Coming Soon". Students will see this page's
        overview, but won't be able to access its objectives, content, or
        test.""",
    )

    details_panels = Page.content_panels + [
        FieldPanel("coming_soon"),
        FieldPanel("description"),
        FieldPanel("long_description"),
        StreamFieldPanel("jobs"),
    ]
    objective_panels = [
        FieldPanel("objective_title"),
        FieldPanel("objective_aim"),
        FieldPanel("objective_duration"),
        StreamFieldPanel("objective_cards"),
    ]
    content_panels = [
        FieldPanel("content_title"),
        FieldPanel("content_aim"),
        FieldPanel("content_duration"),
        StreamFieldPanel("content_cards"),
    ]
    test_panels = [
        FieldPanel("test_title"),
        FieldPanel("test_aim"),
        FieldPanel("test_duration"),
        StreamFieldPanel("test_cards"),
    ]

    edit_handler = TabbedInterface(
        [
            ObjectList(details_panels, heading="Details"),
            ObjectList(objective_panels, heading="Objectives"),
            ObjectList(content_panels, heading="Content"),
            ObjectList(test_panels, heading="Test"),
        ]
    )

    api_fields = [
        APIField("data"),
        APIField("course"),
        APIField("objective"),
        APIField("content"),
        APIField("test"),
    ]

    @property
    def duration(self):
        return self.objective_duration + self.content_duration + self.test_duration

    def data(self):
        return dict(
            id=self.pk,
            title=self.title,
            slug=self.slug,
            description=self.description,
            long_description=self.long_description,
            duration=self.duration,
            jobs=[
                dict(className=job.value, text=JOB_LOOKUP[job.value])
                for job in self.jobs
            ],
            coming_soon=self.coming_soon,
        )

    def course(self):
        return self.get_parent().coursepage.data()

    def objective(self):
        return dict(
            title=self.objective_title,
            aim=self.objective_aim,
            duration=self.objective_duration,
            cards=[c.value for c in self.objective_cards],
        )

    def content(self):
        return dict(
            title=self.content_title,
            aim=self.content_aim,
            duration=self.content_duration,
            cards=[c.block.for_api(c.value) for c in self.content_cards],
        )

    def test(self):
        return dict(
            title=self.test_title,
            aim=self.test_aim,
            duration=self.test_duration,
            cards=[c.value for c in self.test_cards],
        )
