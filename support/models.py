from django.db import models
from accounts.models import CustomUser

class InterviewHistory(models.Model):
    """面接履歴モデル"""
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    question = models.TextField()
    answer = models.TextField()
    feedback = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} - {self.question[:30]}"