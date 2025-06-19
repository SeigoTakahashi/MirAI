from django.urls import path
from .views import MyProfile
from .views import LoginView, SignupView, LogoutView, PasswordReset, PasswordResetDone, PasswordResetConfirm, PasswordResetComplete

app_name = 'accounts'
urlpatterns = [
    path('my_profile/', MyProfile.as_view(), name='my_profile'),  
    path('login/', LoginView.as_view(), name="login"),
    path('signup/', SignupView.as_view(), name="signup"),
    path('logout/', LogoutView.as_view(), name="logout"),
    path('password_reset/', PasswordReset.as_view(), name='password_reset'),
    path('password_reset/done/', PasswordResetDone.as_view(), name='password_reset_done'),
    path('password_reset/confirm/<uidb64>/<token>/', PasswordResetConfirm.as_view(), name='password_reset_confirm'),
    path('password_reset/complete/', PasswordResetComplete.as_view(), name='password_reset_complete'),

]