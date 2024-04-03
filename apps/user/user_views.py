from django.shortcuts import render
from django.http import HttpResponseRedirect
from user.form import createUserForm, FeedbackForm
from user.models import CreateUserTable, FeedBackTable
from utils.script.create_user_constructor import CreateUser

# Create your views here.


def user_list_to_env(env):
    """
    根据环境，生成列表
    :return:
    """
    users = CreateUserTable.objects.filter(environment=env).order_by('-id')[:10]
    user_list = []
    id = 0
    for user in users:
        id += 1
        user_list.append(
            {
                'id': id,
                'user_name': user.user_name,
                'interest': user.interest,
                'personality_label': user.personality_label,
                'create_time': user.create_time
            }
        )
    return user_list

def create_user_list(request):
    users_list_dev = user_list_to_env('开发')
    users_list_test = user_list_to_env('测试')
    users_list_online = user_list_to_env('线上')

    context = {
        'users_list_dev': users_list_dev,
        'users_list_test': users_list_test,
        'users_list_online': users_list_online
    }
    return context

def custom_context_processor(request):
    """
    查询各功能的使用数，即表记录总数
    :param request:
    :return:
    """
    # 创建用户使用数
    CreateUserTable_count = CreateUserTable.objects.all().count()
    FeedBack_count = FeedBackTable.objects.filter(resolve='否').count()
    count_dict = {
        'CreateUserTable_count': CreateUserTable_count,
        'FeedBack_count': FeedBack_count,
    }
    # 你可以在这里添加更多的动态内容到上下文中
    return count_dict


def get_base_template_context(request):
    """
    全局参数
    :param request:
    :return:
    """
    base_template_context = {
        'custom_template_var': '这是一个自定义的基础模板变量',
    }
    base_template_context.update(custom_context_processor(request))
    base_template_context.update(create_user_list(request))
    return base_template_context

def user(request):
    return render(request, "base_user.html")

def feedback(request):
    """
    意见反馈
    :param request:
    :return:
    """
    if request.method == 'GET':
        return render(request, 'base_user.html')
    else:
        feedback_form = FeedbackForm(request.POST)
        print(feedback_form)
        if feedback_form.is_valid():
            title = feedback_form.cleaned_data['title']
            content = feedback_form.cleaned_data['content']
            bb = FeedBackTable()
            bb.title = title
            bb.content = content
            bb.create_by = 'sys'
            bb.save()
            return HttpResponseRedirect('/user')
        else:
            return render(request, 'base_user.html', {
                'feedback_form': feedback_form
            })

def add_user(request):
    """
    创建用户
    :param request:
    :return:
    """
    is_marital_dict = {
        True: '已婚',
        False: '未婚'
    }
    sex_dict = {
        1: '男',
        2: '女'
    }
    try:
        if request.method == 'GET':
            return render(request, 'create_user.html')
        else:
            create_user_form = createUserForm(request.POST)
            if create_user_form.is_valid():
                user_name = create_user_form.cleaned_data['user_name']
                env = create_user_form.cleaned_data['environment']
                is_marital = create_user_form.cleaned_data['is_marital']
                birthdate = create_user_form.cleaned_data['birthdate']
                weight = create_user_form.cleaned_data['weight']
                sex = create_user_form.cleaned_data['sex']
                personality_label = create_user_form.cleaned_data['personality_label']
                interest = create_user_form.cleaned_data['interest1'] + create_user_form.cleaned_data['interest2'] + \
                           create_user_form.cleaned_data['interest3'] + create_user_form.cleaned_data['interest4'] + \
                           create_user_form.cleaned_data['interest5']
                motto = create_user_form.cleaned_data['motto']
                # 调用业务核心脚本
                result = CreateUser.user(user_name, env,  is_marital_dict[is_marital], birthdate, weight, sex_dict[sex],
                                         personality_label, interest, motto)
                # 保存数据至表
                mysql_info = CreateUserTable()
                mysql_info.user_name = user_name
                mysql_info.environment = env
                mysql_info.is_marital = is_marital
                mysql_info.birthdate = birthdate
                mysql_info.weight = weight
                mysql_info.sex = sex
                mysql_info.personality_label = personality_label
                mysql_info.interest = interest
                mysql_info.motto = motto
                mysql_info.save()
                return render(request, 'create_user.html', {
                    'msg': result
                })
            else:
                return render(request, 'create_user.html', {
                    'add_product_form': create_user_form
                })
    except:
        return render(request, 'create_user.html', {
            'msg': result
        })