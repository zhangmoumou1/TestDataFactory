"""blog URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.8/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Add an import:  from blog import urls as blog_urls
    2. Add a URL to urlpatterns:  url(r'^blog/', include(blog_urls))
"""
from django.conf.urls import include, url

from .views import del_dribute, del_user, other_apps, create_cps_order, create_idCard, add_employee, switch_emprole, \
    create_user_list, fsto_user, create_buser, jenkins_task, nacos_config, update_login_time,update_role, \
    query_distribute,again_add_product, again_related_enterprise, again_product_commission_rate, \
    again_product_commission_compute, feedback

urlpatterns = [
    url(r'^deldribute/$',del_dribute,name='del_dribute'),
    url(r'^deluser/$', del_user, name='del_user'),
    url(r'^otherapps/$', other_apps, name='other_apps'),
    url(r'^createcps/$', create_cps_order, name='create_cps_order'),
    url(r'^createidcard/$', create_idCard, name='create_idCard'),
    url(r'^addemployee/$', add_employee, name='add_employee'),
    url(r'^switchrole/$', switch_emprole, name='switch_emprole'),
    url(r'^createuser/$', create_user_list, name='create_user_list'),
    url(r'^fstouser/$', fsto_user, name='fsto_user'),
    url(r'^createbuser/$', create_buser, name='create_buser'),
    url(r'^jenkinstask/$', jenkins_task, name='jenkins_task'),
    url(r'^nacosconfig/$', nacos_config, name='nacos_config'),
    url(r'^updatelogintime/$', update_login_time, name='update_login_time'),
    url(r'^updaterole/$', update_role, name='update_role'),
    url(r'^seldistribute/$', query_distribute, name='sel_distribute'),
    url(r'^addproduct/$', again_add_product, name='add_product'),
    url(r'^relatedwx/$', again_related_enterprise, name='related_enterprise'),
    url(r'^commission/$', again_product_commission_rate, name='product_commission_rate'),
    url(r'^compute/$', again_product_commission_compute, name='product_commission_compute'),
    url(r'^feedback/$', feedback, name='feedback'),
]