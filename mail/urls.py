from django.urls import path
from .views import EmailCreate, EmailReplyCreate, EmailStructureCheck, EmailTemplate

app_name = 'mail'
urlpatterns = [
    path('mail_create/', EmailCreate.as_view(), name='mail_create'),  
    path('mail_reply_create/', EmailReplyCreate.as_view(), name='mail_reply_create'), 
    path('mail_structure_check/', EmailStructureCheck.as_view(), name='mail_structure_check'),
    path('mail_template/', EmailTemplate.as_view(), name='mail_template'),  
]