from django.contrib.auth.forms import UserCreationForm, AuthenticationForm, PasswordResetForm, SetPasswordForm
from .models import CustomUser
from django import forms
import datetime

class ProfileForm(forms.Form):
    """プロフィールフォーム"""
    
    GENDER_CHOICES = [
        ('', '選択してください'),
        ('男性', '男性'),
        ('女性', '女性'),
        ('その他', 'その他'),
    ]
    gender = forms.ChoiceField(label="性別", required=False, choices=GENDER_CHOICES, widget=forms.Select(attrs={'class': 'form-select'}))

    school_name = forms.CharField(label="学校名", required=False, max_length=100, widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': '例：ABC大学教養学部教養学科'}))

    graduation_year = forms.ChoiceField(label="卒業予定年", required=False, choices=[], widget=forms.Select(attrs={'class': 'form-select'}))

    certifications = forms.CharField(label="保有資格", required=False, widget=forms.Textarea(attrs={'class': 'form-control auto-resize', 'rows': 1, 'placeholder': '例：応用情報技術者、TOEIC 800点、日商簿記2級など'}))

    JOB_TYPE_CHOICES = [
        ('', '選択してください'),
        ('エンジニア', 'エンジニア'),
        ('データサイエンティスト', 'データサイエンティスト'),
        ('営業職', '営業職'),
        ('企画職', '企画職'),
        ('マーケティング', 'マーケティング'),
        ('人事・総務', '人事・総務'),
        ('その他', 'その他'),
    ]
    job_type = forms.ChoiceField(label="希望職種", required=False, choices=JOB_TYPE_CHOICES, widget=forms.Select(attrs={'class': 'form-select'}))

    INDUSTRY_CHOICES = [
        ('', '選択してください'),
        ('IT・通信', 'IT・通信'),
        ('製造業', '製造業'),
        ('金融・保険', '金融・保険'),
        ('教育・出版', '教育・出版'),
        ('コンサルティング', 'コンサルティング'),
        ('医療・福祉', '医療・福祉'),
        ('官公庁・自治体', '官公庁・自治体'),
        ('その他', 'その他'),
    ]
    industry = forms.ChoiceField(label="希望業種", required=False, choices=INDUSTRY_CHOICES, widget=forms.Select(attrs={'class': 'form-select'}))

    WORKSTYLE_CHOICES = [
        ('', '選択してください'),
        ('出社中心', '出社中心'),
        ('フルリモート', 'フルリモート'),
        ('ハイブリッド（出社＋在宅）', 'ハイブリッド（出社＋在宅）'),
        ('特にこだわらない', '特にこだわらない'),
    ]
    workstyle = forms.ChoiceField(label="働き方の希望", required=False, choices=WORKSTYLE_CHOICES, widget=forms.Select(attrs={'class': 'form-select'}))

    self_pr = forms.CharField(label="自己PR", required=False, widget=forms.Textarea(attrs={'class': 'form-control auto-resize', 'rows': 1, 'placeholder': 'あなたの強みやアピールポイントを記入してください'}))

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # 現在年数からプラス6年のプルダウンを生成
        current_year = datetime.date.today().year
        self.fields['graduation_year'].choices = [('', '選択してください')] + [(str(year), f"{year}年") for year in range(current_year, current_year + 6)]


class UserForm(forms.ModelForm):
    """ユーザープロフィール編集用フォーム"""

    class Meta:
        model = CustomUser
        fields = ("email", "full_name")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            field.widget.attrs["class"] = "form-control"


class SignUpForm(UserCreationForm):
    """ユーザー新規登録用フォーム"""

    class Meta:
        model = CustomUser
        fields = ("email", "password1", "password2", "full_name")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            field.widget.attrs["class"] = "form-control"


class LoginForm(AuthenticationForm):
    """ユーザーログイン用フォーム（Emailでログイン）"""

    username = forms.EmailField(label="メールアドレス")  # フィールド名は username のまま、label を変更

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["username"].widget.attrs["class"] = "form-control"
        self.fields["password"].widget.attrs["class"] = "form-control"

from django.contrib.auth.forms import PasswordResetForm, SetPasswordForm


class MyPasswordResetForm(PasswordResetForm):
    """パスワード忘れたときのフォーム"""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            field.widget.attrs['class'] = 'form-control'


class MySetPasswordForm(SetPasswordForm):
    """パスワード再設定用フォーム(パスワード忘れて再設定)"""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            field.widget.attrs['class'] = 'form-control'

