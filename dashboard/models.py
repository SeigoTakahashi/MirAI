from django.db import models
from accounts.models import CustomUser
from information.models import Company

class Event(models.Model):
    """カレンダーイベントモデル"""
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    company = models.ForeignKey(Company, null=True, blank=True, on_delete=models.SET_NULL)
    title = models.CharField(max_length=255)
    start = models.DateTimeField()
    end = models.DateTimeField(null=True, blank=True)
    all_day = models.BooleanField(default=False)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=7, default='#3788d8')

    def __str__(self):
        return self.title
