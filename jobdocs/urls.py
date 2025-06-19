from django.urls import path
from .views import JobdocsCreateView, JobdocsCheckView, JobdocsTemplateView, JobdocsEditView 

app_name = 'jobdocs'
urlpatterns = [ 
    path('jobdocs_create/', JobdocsCreateView.as_view(), name='jobdocs_create'),
    path('jobdocs_check/', JobdocsCheckView.as_view(), name='jobdocs_check'),
    path('jobdocs_template/', JobdocsTemplateView.as_view(), name='jobdocs_template'),
    path('jobdocs_edit/', JobdocsEditView.as_view(), name='jobdocs_edit'),
]