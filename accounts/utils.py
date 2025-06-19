from allauth.socialaccount.models import SocialAccount

# 名前を取得する
def get_user_display_name(user):
    try:
        social = SocialAccount.objects.get(user=user, provider='google')
        return social.extra_data.get('name')
    except SocialAccount.DoesNotExist:
        return user.get_full_name()

# メールアドレスを取得する
def get_user_display_email(user):
    try:
        social = SocialAccount.objects.get(user=user, provider='google')
        return social.extra_data.get('email')
    except SocialAccount.DoesNotExist:
        return user.email