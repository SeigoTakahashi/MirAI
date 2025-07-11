from django.urls import path
from .views import (
    InterviewSupportView, 
    GetFeedbackView, 
    GetQuestionView, 
    InterviewFeedbackView, 
    InterviewTemplateView,
    InterviewHistorySaveView,
    GetDialogQuestionView,
    GetContentFinalScoreView,
)

app_name = 'support'
urlpatterns = [ 
    path('interview_support/', InterviewSupportView.as_view(), name='interview_support'),
    path('get-feedback/', GetFeedbackView.as_view(), name='get_feedback'),
    path('get-question/', GetQuestionView.as_view(), name='get_question'),
    path('interview_feedback/', InterviewFeedbackView.as_view(), name='interview_feedback'),
    path('interview_template/', InterviewTemplateView.as_view(), name='interview_template'),
    path('interview_history_save/', InterviewHistorySaveView.as_view(), name='interview_history_save'),
    path('get_dialog_question/', GetDialogQuestionView.as_view(), name='get_dialog_question'),
    path('get_content_final_score/', GetContentFinalScoreView.as_view(), name='get_content_final_score'),
]