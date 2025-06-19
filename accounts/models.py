from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.base_user import BaseUserManager

class CustomUserManager(BaseUserManager):
    """カスタムユーザーマネージャー"""

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("メールアドレスは必須です")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("スーパーユーザーは is_staff=True でなければなりません。")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("スーパーユーザーは is_superuser=True でなければなりません。")

        return self.create_user(email, password, **extra_fields)

class CustomUser(AbstractUser):
    """カスタムユーザーモデル"""

    username = models.CharField(max_length=150, unique=True, blank=True, null=True)  # username フィールドを追加
    email = models.EmailField(unique=True, verbose_name="メールアドレス")  # メールアドレスをユニークに設定
    full_name = models.CharField(max_length=255, verbose_name="名前")  # 新規登録用の名前フィールド

    USERNAME_FIELD = 'email'  # ログインに使うフィールド
    REQUIRED_FIELDS = ['full_name']  # createsuperuser 時に必要な項目

    objects = CustomUserManager()


class Profile(models.Model):
    """ プロフィールモデル """
    user = models.ForeignKey(  
        to=CustomUser,
        verbose_name='ユーザ',
        on_delete=models.CASCADE,
        null=True
    )

    gender = models.CharField(max_length=10, blank=True)
    school_name = models.CharField(max_length=100, blank=True)
    graduation_year = models.CharField(max_length=4, blank=True)
    certifications = models.TextField(blank=True)
    job_type = models.CharField(max_length=30, blank=True)
    industry = models.CharField(max_length=30, blank=True)
    workstyle = models.CharField(max_length=30, blank=True)
    self_pr = models.TextField(blank=True)

    def __str__(self):
        return f"{self.user.username} のプロフィール"