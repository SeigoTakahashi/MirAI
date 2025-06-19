from django.urls import path
from .views import DashboardView, EventListAPI, EventCreateAPI, EventUpdateAPI, EventDeleteAPI

app_name = 'dashboard'
urlpatterns = [ 
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('api/events/', EventListAPI.as_view(), name='event_list_api'),
    path('api/events/create/', EventCreateAPI.as_view(), name='event_create_api'),
    path('api/events/update/<int:pk>/', EventUpdateAPI.as_view(), name='event_update_api'),
    path('api/events/delete/<int:pk>/', EventDeleteAPI.as_view(), name='event_delete_api'),
]