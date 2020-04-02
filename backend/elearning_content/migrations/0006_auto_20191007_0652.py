# Generated by Django 2.2.5 on 2019-10-07 06:52

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('elearning_content', '0005_auto_20191007_0522'),
    ]

    operations = [
        migrations.AddField(
            model_name='lessonpage',
            name='long_description',
            field=models.TextField(blank=True),
        ),
        migrations.AlterField(
            model_name='coursepage',
            name='colour',
            field=models.CharField(choices=[('blue-1', 'blue-1 - #04788E'), ('blue-2', 'blue-2 - #00B8AD'), ('brown', 'brown - #744D4D'), ('gray-1', 'gray-1 - #2A3942'), ('gray-2', 'gray-2 - #3F525E'), ('gray-3', 'gray-3 - #596973'), ('gray-4', 'gray-4 - #82939E'), ('gray-5', 'gray-5 - #A0AFB8'), ('gray-6', 'gray-6 - #C9D6DE'), ('gray-7', 'gray-7 - #C9D6DE'), ('gray-8', 'gray-8 - #E8EEF1'), ('gray-9', 'gray-9 - #F4F8FA'), ('gray-10', 'gray-10 - #FAFDFF'), ('green-1', 'green-1 - #007B56'), ('green-2', 'green-2 - #10B584'), ('green-3', 'green-3 - #F4FFFC'), ('orange-1', 'orange-1 - #F66400'), ('orange-2', 'orange-2 - #F67C36'), ('pink-1', 'pink-1 - #8A0079'), ('pink-2', 'pink-2 - #C300AB'), ('purple', 'purple - #6F6CAC'), ('red-1', 'red-1 - #DE3011'), ('red-2', 'red-2 - #FF694D'), ('white', 'white - #FFFFFF')], default='red-1', max_length=16),
        ),
    ]
