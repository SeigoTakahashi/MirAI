from django.contrib import admin
from django.urls import path
from django.urls import path, include
from dashboard.views import DashboardView, TitleView
from django.shortcuts import render

urlpatterns = [
    path('', TitleView.as_view(), name='dashboard'),
    path('dashboard/', include('dashboard.urls')),
    path('support/', include('support.urls')),
    path('mail/', include('mail.urls')),
    path('accounts/', include('accounts.urls')),
    path('aptitude/', include('aptitude.urls')),
    path('information/', include('information.urls')),
    path('jobdocs/', include('jobdocs.urls')),
    path('todo/', include('todo.urls')),
    path('social-auth/', include('allauth.urls')),
    path("admin/", admin.site.urls),
    # path("test/error/", lambda request: render(request, 'generation_error.html'))
]
