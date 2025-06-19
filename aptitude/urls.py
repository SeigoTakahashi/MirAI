from django.urls import path
from .views import AptitudeDiagnosisView

app_name = 'aptitude'
urlpatterns = [
    path('aptitude_diagnosis/', AptitudeDiagnosisView.as_view(), name='aptitude_diagnosis'),  
]