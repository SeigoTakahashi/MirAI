from django.views.generic import View
from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import render
from mail.utils import generate_text
from django.shortcuts import redirect
from accounts.models import Profile
from accounts.utils import get_user_display_name
import json
import re

class AptitudeDiagnosisView(LoginRequiredMixin, View):
    """企業適性診断ページ"""
    
    def get(self, request, *args, **kwargs):
        # 初期状態ではフォームだけを表示
        
        user = request.user
        try:
            profile = Profile.objects.get(user=user)
            profile_not_set = False
        except Profile.DoesNotExist:
            # プロフィールが存在しない場合、プロフィール登録画面へリダイレクト
            profile_not_set = True
        return render(request, 'aptitude/aptitude_diagnosis.html', {'profile_not_set': profile_not_set})


    

    def post(self, request, *args, **kwargs):
        user = request.user

        try:
            profile = Profile.objects.get(user=user)
        except Profile.DoesNotExist:
            # プロフィールが存在しない場合、プロフィール登録画面へリダイレクト
            return redirect('accounts:my_profile')  # 名前付きURLに合わせて修正してください

        def safe_get(value, default="未入力"):
            return value if value else default

        # プロンプトを作成
        prompt = f"""
        以下の人物のプロフィールをもとに、企業適性診断を行ってください。

        名前: {get_user_display_name(user)}
        性別: {safe_get(profile.gender)}
        学校名: {safe_get(profile.school_name)}
        卒業予定年: {safe_get(profile.graduation_year)}
        保有資格: {safe_get(profile.certifications)}
        希望職種: {safe_get(profile.job_type)}
        希望業種: {safe_get(profile.industry)}
        希望する働き方: {safe_get(profile.workstyle)}

        自己PR:
        {profile.self_pr}


        以下の JSON 形式で出力してください（値は日本語）:

        {{
              "Suitable_Company_Type": "この人に合う会社のタイプと理由を日本語で書いてください。",
              "Suitable_Industry": "この人に合う業界とその理由を日本語で書いてください。",
              "Suitable_Job_Role": "この人に合う職種とその理由を日本語で書いてください。",
              "Ideal_Company_Culture": "この人に合う企業文化とその理由を日本語で書いてください。"
          }}
        """
        
        # Gemini API 呼び出し
        try:
            text = generate_text(prompt)
        except Exception as e:
            return render(request, 'generation_error.html')
        # コンテキストに結果を渡してテンプレートに表示
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            json_text = match.group()
            result_dict = json.loads(json_text)
            return render(request, 'aptitude/aptitude_diagnosis.html', {'result': result_dict})
        else:
            return render(request, 'aptitude/aptitude_diagnosis.html', {'error': '出力にJSONが見つかりませんでした。'})

        

    