from django.urls import path
from .views import (
    TodoListView, TodoListApiView, TodoAddView,
    TodoDeleteView, TodoToggleCompleteView
)

app_name = 'todo'

urlpatterns = [
    path('', TodoListView.as_view(), name='todo_page'),
    path('api/list/', TodoListApiView.as_view(), name='todo_api_list'),
    path('add/', TodoAddView.as_view(), name='todo_add'),
    path('delete/<int:todo_id>/', TodoDeleteView.as_view(), name='todo_delete'),
    path('toggle/<int:todo_id>/', TodoToggleCompleteView.as_view(), name='todo_toggle'),
]