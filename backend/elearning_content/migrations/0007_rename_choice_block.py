# Generated by Django 2.2.5 on 2019-10-11 05:30

from django.db import migrations
import wagtail.core.blocks
import wagtail.core.fields


class Migration(migrations.Migration):

    dependencies = [
        ('elearning_content', '0006_auto_20191007_0652'),
    ]

    operations = [
        migrations.AlterField(
            model_name='lessonpage',
            name='test_cards',
            field=wagtail.core.fields.StreamField([('single_choice', wagtail.core.blocks.StructBlock([('question', wagtail.core.blocks.CharBlock(max_length=256)), ('answers', wagtail.core.blocks.ListBlock(wagtail.core.blocks.StructBlock([('text', wagtail.core.blocks.CharBlock(max_length=64)), ('correct', wagtail.core.blocks.BooleanBlock(default=False, required=False))])))]))]),
        ),
    ]
