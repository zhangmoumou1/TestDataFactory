# Generated by Django 3.1 on 2024-04-01 08:33

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('user', '0003_auto_20240401_1529'),
    ]

    operations = [
        migrations.AlterField(
            model_name='createusertable',
            name='environment',
            field=models.CharField(choices=[('1', '开发环境'), ('2', '测试环境'), ('3', '线上环境')], max_length=10, verbose_name='环境'),
        ),
        migrations.AlterField(
            model_name='createusertable',
            name='sex',
            field=models.CharField(choices=[('1', '男'), ('2', '女')], max_length=10, verbose_name='性别'),
        ),
    ]
