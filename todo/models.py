from django.db import models
from accounts.models import CustomUser

class Todo(models.Model):
    """ToDoモデル"""
    
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    task = models.CharField(max_length=255)
    completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)