from django.views.generic import FormView, CreateView
from django.urls import reverse_lazy
import smtplib
from django.shortcuts import render
from django.contrib.auth import authenticate, login
from django.contrib.auth.views import PasswordResetView, PasswordResetDoneView, PasswordResetConfirmView, PasswordResetCompleteView
from django.contrib.auth.views import LoginView as BaseLoginView, LogoutView as BaseLogoutView
from django.contrib.auth.mixins import LoginRequiredMixin
from .forms import ProfileForm, SignUpForm, LoginForm, MyPasswordResetForm, MySetPasswordForm
from .models import Profile

class MyProfile(LoginRequiredMixin, FormView):
    """ プロフィールページ """
    template_name = 'accounts/my_profile.html'
    form_class = ProfileForm
    success_url = reverse_lazy('accounts:my_profile')

    def get_initial(self):
        """保存済みプロフィールがあれば初期値としてフォームに表示"""
        initial = super().get_initial()
        user = self.request.user

        try:
            profile = Profile.objects.get(user=user)
            initial.update({
                'gender': profile.gender,
                'school_name': profile.school_name,
                'graduation_year': profile.graduation_year,
                'certifications': profile.certifications,
                'job_type': profile.job_type,
                'industry': profile.industry,
                'workstyle': profile.workstyle,
                'self_pr': profile.self_pr,
            })
        except Profile.DoesNotExist:
            pass  # プロフィール未作成の場合は初期値なし
        return initial

    def form_valid(self, form):
        user = self.request.user

        # フォームから送られたデータを使って Profile を更新または作成
        Profile.objects.update_or_create(
            user=user,
            defaults={
                'gender': form.cleaned_data['gender'],
                'school_name': form.cleaned_data['school_name'],
                'graduation_year': form.cleaned_data['graduation_year'],
                'certifications': form.cleaned_data['certifications'],
                'job_type': form.cleaned_data['job_type'],
                'industry': form.cleaned_data['industry'],
                'workstyle': form.cleaned_data['workstyle'],
                'self_pr': form.cleaned_data['self_pr'],
            }
        )

        return super().form_valid(form)


class SignupView(CreateView):
    """新規登録ページ"""

    form_class = SignUpForm
    template_name = "accounts/signup.html"
    success_url = reverse_lazy("dashboard:dashboard")

    def form_valid(self, form):
        response = super().form_valid(form)
        email = form.cleaned_data.get("email")
        password = form.cleaned_data.get("password1")
        user = authenticate(self.request, email=email, password=password)
        if user is not None:
            login(self.request, user)
        return response


class LoginView(BaseLoginView):
    """ログインページ"""

    form_class = LoginForm
    template_name = "accounts/login.html"

    def get_success_url(self):
        return reverse_lazy('dashboard:dashboard')


class LogoutView(BaseLogoutView):
    """ログアウトページ"""

    success_url = reverse_lazy("accounts:login")


class PasswordReset(PasswordResetView):
    """パスワード変更用URLの送付ページ"""

    subject_template_name = 'accounts/password_reset_mail/subject.txt'
    email_template_name = 'accounts/password_reset_mail/message.txt'
    template_name = 'accounts/password_reset_form.html'
    form_class = MyPasswordResetForm
    success_url = reverse_lazy('accounts:password_reset_done')

    def form_valid(self, form):
      try:
          # 入力されたメールアドレスに対応するユーザーを取得
          email = form.cleaned_data['email']
          user = self.get_users(email).first()

          if user and not user.has_usable_password():
              return render(self.request, 'accounts/password_reset_error.html', {
                  'error_message': 'このアカウントは外部認証（Googleなど）で作成されています。パスワードリセットはご利用いただけません。'
              })

          return super().form_valid(form)

      except smtplib.SMTPNotSupportedError:
          return render(self.request, 'accounts/password_reset_error.html', {
              'error_message': 'このネットワーク環境ではメール送信がサポートされていません。別のネットワークをご利用ください。'
          })

      except smtplib.SMTPException as e:
          return render(self.request, 'accounts/password_reset_error.html', {
              'error_message': f'メール送信中にエラーが発生しました: {str(e)}'
          })

      except Exception as e:
          return render(self.request, 'accounts/password_reset_error.html', {
              'error_message': f'予期しないエラーが発生しました。時間をおいて再度お試しください。{str(e)}'
          })


class PasswordResetDone(PasswordResetDoneView):
    """パスワード変更用URLを送りましたページ"""

    template_name = 'accounts/password_reset_done.html'


class PasswordResetConfirm(PasswordResetConfirmView):
    """新パスワード入力ページ"""

    form_class = MySetPasswordForm
    success_url = reverse_lazy('accounts:password_reset_complete')
    template_name = 'accounts/password_reset_confirm.html'


class PasswordResetComplete(PasswordResetCompleteView):
    """新パスワード設定しましたページ"""

    template_name = 'accounts/password_reset_complete.html'