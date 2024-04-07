from django import forms

class FeedbackForm(forms.Form):
    """
    意见反馈
    """
    title = forms.CharField(max_length=50, min_length=1, required=True, error_messages={
        'required': '标题为必填'
    })
    content = forms.CharField(min_length=1, required=True, error_messages={
        'required': '反馈内容为必填'
    })

# Create your models here.
class createUserForm(forms.Form):
    """
    创建用户
    """
    user_name = forms.CharField(max_length=20, min_length=1, required=True, error_messages={
        'max_length': '用户名最大长度为10',
        'min_length': '用户名最小长度为1',
        'required': '用户名必填',
    })
    environment = forms.CharField(required=True)
    is_marital = forms.BooleanField(required=False)
    birthdate = forms.CharField(required=True)
    sex = forms.IntegerField(required=True)
    weight = forms.IntegerField(required=True)
    personality_label = forms.CharField(max_length=100, required=False, error_messages={
        'max_length': '个性标签为100',
    })
    interest1 = forms.CharField(required=False)
    interest2 = forms.CharField(required=False)
    interest3 = forms.CharField(required=False)
    interest4 = forms.CharField(required=False)
    interest5 = forms.CharField(required=False)
    motto = forms.CharField(max_length=1000, required=False, error_messages={
        'max_length': '座右铭最大长度为1000',
    })

class rollbackUserForm(forms.Form):
    """
    回滚创建用户
    """
    id = forms.IntegerField(required=True)