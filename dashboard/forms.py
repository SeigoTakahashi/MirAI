from django import forms
from .models import Event, Company

class EventForm(forms.ModelForm):
    """カレンダーイベントフォーム"""
    class Meta:
        model = Event
        fields = ['title', 'start', 'end', 'all_day', 'description', 'company', 'color']
        widgets = {
            'start': forms.DateTimeInput(attrs={'type': 'date'}),
            'end': forms.DateTimeInput(attrs={'type': 'date'}),
        }

    def __init__(self, *args, **kwargs):
        user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)
        if user:
            self.fields['company'].queryset = Company.objects.filter(user=user)
        self.fields['company'].required = False