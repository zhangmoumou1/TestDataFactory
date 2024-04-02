"""TestDataFactory URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from django.conf.urls import include, url
from apps.order import order_views
from apps.user import user_views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', user_views.user, name='user'),
    path('user', user_views.user, name='user'),
    path('order', order_views.order, name='order'),
    url(r'^tools/', include(('user.urls', 'user'), namespace='user')),
    # url(r'^tools/', include(('order.urls', 'user'), namespace='order')),
]
