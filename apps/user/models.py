from django.db import models


class FeedBackTable(models.Model):
    """
    意见反馈
    """
    title = models.CharField(max_length=50, verbose_name='标题')
    content = models.TextField(max_length=1000, verbose_name='内容')
    resolve = models.CharField(max_length=50, default='否', verbose_name='是否解决')
    create_time = models.DateTimeField(auto_now=True, verbose_name='创建时间')
    update_time = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    create_by = models.CharField(max_length=10, null=True, default='sys', verbose_name='创建人')
    class Meta:
        db_table = 'feedback'

class CreateUserTable(models.Model):
    """
    创建用户
    """
    id = models.AutoField(primary_key=True, verbose_name='主键id')
    user_name = models.CharField(max_length=20, null=True, verbose_name='用户名')
    is_marital = models.BooleanField(null=True, verbose_name='是否结婚')
    environment = models.CharField(max_length=10, verbose_name='环境')
    birthdate = models.CharField(max_length=30, null=True, verbose_name='出生日期')
    weight = models.IntegerField(null=True, verbose_name='体重')
    SEX_CHOICES = [
        ('1', '男'),
        ('2', '女')
    ]
    sex = models.CharField(choices=SEX_CHOICES, max_length=10, verbose_name='性别')
    personality_label = models.CharField(max_length=100, null=True, verbose_name='个性标签')
    interest = models.CharField(max_length=100, null=True, verbose_name='爱好')
    motto = models.TextField(null=True, verbose_name='座右铭')
    create_time = models.DateTimeField(auto_now=True, verbose_name='创建时间')
    update_time = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    create_by = models.CharField(max_length=10, null=True, default='sys', verbose_name='创建人')

    class Meta:
        db_table = 'create_user'
