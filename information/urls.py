from django.urls import path
from .views import (
    InformationView, 
    InformationDetailView, 
    InformationAddView, 
    AddCustomFieldView, 
    CompanyDeleteView,
    CustomFieldDeleteView,
    InlineUpdateView,
    UpdateStepSelectionView,
    UpdateCurrentStepView,
    ResetCurrentStepView,
)

app_name = 'information'
urlpatterns = [ 
    path('information_list/', InformationView.as_view(), name='company_information_list'),
    path('information_add/', InformationAddView.as_view(), name='company_information_add'),
    path('information_detail/<int:pk>/', InformationDetailView.as_view(), name='company_information_detail'),
    path('add_custom_field/', AddCustomFieldView.as_view(), name='add_custom_field'),
    path('information_delete/<int:company_id>/', CompanyDeleteView.as_view(), name='company_information_delete'),
    path('custom_field_delete/', CustomFieldDeleteView.as_view(), name='custom_field_delete'),
    path('inline_update/', InlineUpdateView.as_view(), name='inline_update'),
    path('update_step_selection/', UpdateStepSelectionView.as_view(), name='update_step_selection'),
    path('update_current_step/', UpdateCurrentStepView.as_view(), name='update_current_step'),
    path('reset_current_step/', ResetCurrentStepView.as_view(), name='reset_current_step'),
]