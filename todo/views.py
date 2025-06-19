from django.views import View
from django.views.generic import TemplateView
from django.http import JsonResponse, HttpResponseForbidden
from django.contrib.auth.mixins import LoginRequiredMixin
from .models import Todo
import json

class TodoListView(LoginRequiredMixin, TemplateView):
    """Todoリストページ"""

    template_name = 'todo/todo_list.html'

class TodoListApiView(LoginRequiredMixin, View):
    """TodoリストAPI"""

    def get(self, request, *args, **kwargs):
        todos = Todo.objects.filter(user=request.user).order_by('completed', '-created_at')
        todo_list = [
            {'id': todo.id, 'task': todo.task, 'completed': todo.completed}
            for todo in todos
        ]
        return JsonResponse(todo_list, safe=False)

class TodoAddView(LoginRequiredMixin, View):
    """Todo追加API"""

    def post(self, request, *args, **kwargs):
        data = json.loads(request.body)
        todo = Todo.objects.create(user=request.user, task=data['task'])
        return JsonResponse({'id': todo.id, 'task': todo.task, 'completed': todo.completed})

class TodoDeleteView(LoginRequiredMixin, View):
    """Todo削除API"""

    def delete(self, request, todo_id, *args, **kwargs):
        try:
            todo = Todo.objects.get(id=todo_id, user=request.user)
            todo.delete()
            return JsonResponse({'deleted': True})
        except Todo.DoesNotExist:
            return HttpResponseForbidden("Not allowed")

class TodoToggleCompleteView(LoginRequiredMixin, View):
    """Todo完了状態切替API"""
    
    def patch(self, request, todo_id, *args, **kwargs):
        try:
            data = json.loads(request.body)
            todo = Todo.objects.get(id=todo_id, user=request.user)
            todo.completed = data.get('completed', not todo.completed)
            todo.save()
            return JsonResponse({'completed': todo.completed})
        except Todo.DoesNotExist:
            return HttpResponseForbidden("Not allowed")
