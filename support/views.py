from django.views.generic import View, TemplateView
from django.http import JsonResponse
from django.shortcuts import render
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.mixins import LoginRequiredMixin
from django.db.models import Q
from mail.utils import generate_text
from information.models import Company, Progress
from support.models import InterviewHistory
from accounts.models import Profile
from accounts.utils import get_user_display_name
import random

class InterviewSupportView(TemplateView):
    """面接サポートページ"""

    template_name = 'support/interview_support.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        # ログインしている場合、ユーザーの会社情報を取得
        if self.request.user.is_authenticated:
            companies = Company.objects.filter(user=self.request.user)
        else:
            companies = Company.objects.none()

        # 会社情報をテンプレートに渡す
        context['companies'] = companies

        return context


@method_decorator(csrf_exempt, name='dispatch')
class GetFeedbackView(View):
    """フィードバック取得API"""

    def post(self, request):
        answer = request.POST.get('text', '')
        question = request.POST.get('question', '')
        # プロンプトを作成
        prompt = f"""
        以下は就職面接の模擬練習における質疑応答です。

        【質問】
        {question}

        【回答】
        {answer}

        この回答について、面接官の視点から日本語でフィードバックしてください。

        【条件】
        - 良い点と改善点をそれぞれ**1文ずつ**で述べてください（長文化・冗長な解説は避ける）。
        - 評価はできる限り具体的にしてください（例：「具体性があり印象に残る回答です」など）。
        - 出力は**テキストのみ**とし、**太字・箇条書き・装飾などは使わない**でください。
        - 回答者は就職活動中の学生であることを前提に、適切な言葉遣い・内容かも考慮してください。
        """
        try:
            # GEMINI APIを使用してフィードバックを生成
            feedback = generate_text(prompt)
        except Exception as e:
            feedback = "フィードバックの生成に失敗しました。もう一度お試しください。"
        return JsonResponse({'feedback': feedback})

@method_decorator(csrf_exempt, name='dispatch')
class GetQuestionView(View):
    """質問取得API"""

    def get(self, request):
        company_id = request.GET.get('company_id', None)
        user = request.user

        # 選択中の会社を取得
        selected_company = None
        if company_id and user.is_authenticated:
            try:
                selected_company = Company.objects.get(id=company_id, user=user)
            except Company.DoesNotExist:
                selected_company = None
        
        company_info_text = ""

        # 会社情報の取得
        if selected_company:
            company_info = [
                ("会社名", selected_company.name),
                ("取締役代表", selected_company.ceo),
                ("本社所在地", selected_company.address),
                ("設立年度", selected_company.established_year),
                ("資本金", selected_company.capital),
                ("従業員数", selected_company.employees_count),
                ("事業内容", selected_company.business_content),
                ("公式HP", selected_company.official_website),
            ]

            progress = Progress.objects.filter(company=selected_company, user=user).first()
            if progress and progress.current_step:
                company_info.append(("就職活動の進捗", progress.current_step.description))
            
            company_info_text += "\n【企業情報】\n"
            for label, value in company_info:
                if value:
                    company_info_text += f"{label}: {value}\n"

            # カスタムフィールドも追加
            custom_fields = selected_company.custom_fields.all()
            if custom_fields.exists():
                company_info_text += "\n【カスタム項目】\n"
                for field in custom_fields:
                    if field.field_name and field.field_value:
                        company_info_text += f"{field.field_name}: {field.field_value}\n"

        # カテゴリのリストを定義
        category_list = [
            "志望動機（会社・業界・職種）",
            "自己PR（強み・弱み・成果・経験）",
            "学生時代に力を入れたこと（ガクチカ）",
            "チームワーク・リーダーシップ経験",
            "挫折経験と乗り越え方",
            "キャリアビジョン（入社後・中長期的な目標）",
            "応募企業への理解・調査",
            "ロジカルシンキング・問題解決力",
            "コミュニケーション能力",
            "時事・社会問題に対する意見",
            "逆質問（応募者から企業への質問）",
            "ストレス耐性・メンタルケア",
            "価値観・働く上で大事にしていること",
            "多様性・ダイバーシティへの考え",
            "現代的テーマへの関心（AI・DX・グローバル など）"
        ]

        # カテゴリをランダムに選ぶ
        random_category = random.choice(category_list)

        # プロンプトを作成
        prompt = f"""

        あなたは、優秀で経験豊富な人事担当者です。
        以下の会社情報をもとに、この企業を志望する新卒・未経験者向けの模擬面接で使える質問を1つ、日本語で出してください。
        
        会社情報は以下の通りです。
        {company_info_text}
        会社情報がない場合は、汎用的かつ一般的な質問を作成してください。
        
        以下のカテゴリに基づいて質問を作成してください。

        【質問の条件】  
        - フォーマットは「質問：〜〜」としてください。
        - 出力は、カテゴリを含まずに質問文のみとしてください。
        - 必ず、質問は1つだけにしてください。

        【カテゴリ】  
        {random_category}

        以下に学生のプロフィール情報を記します。
        プロフィール情報がない場合は、汎用的かつ一般的な質問を作成してください。
        【学生プロフィール】
        

        """

    

        base_info = []  # プロフィール情報を格納するリスト

        # ログイン済みかどうか確認
        if user.is_authenticated:
            try:
                # プロフィール情報を取得
                profile = Profile.objects.get(user=user)
                base_info = [
                    ("氏名", get_user_display_name(user)),
                    ("性別", profile.gender),
                    ("学校名", profile.school_name),
                    ("卒業予定年", f"{profile.graduation_year}年"),
                    ("保有資格", profile.certifications),
                    ("希望職種", profile.job_type),
                    ("希望業種", profile.industry),
                    ("希望する働き方", profile.workstyle),
                    ("自己PR", profile.self_pr),
                ]
            except Profile.DoesNotExist:
                pass  # プロフィールがまだ作られていない場合はスキップ
        
        for label, value in base_info:
            if value:
                prompt += f"【{label}】{value}\n"
        

        # 未ログイン or プロフィールなしなら base_info は空のまま
        try:
            question = generate_text(prompt)
        except Exception as e:
            question = "質問の生成に失敗しました。もう一度お試しください。"
        return JsonResponse({'question': question})

@method_decorator(csrf_exempt, name='dispatch')
class InterviewHistorySaveView(LoginRequiredMixin, View):
    """面接履歴保存API"""
    def post(self, request):
        user = request.user
        question = request.POST.get('question', '')
        answer = request.POST.get('answer', '')
        feedback = request.POST.get('feedback', '')

        if not question or not answer:
            return JsonResponse({'error': '質問と回答は必須です。'}, status=400)

        try:
            # 面接履歴を保存
            interview_history = InterviewHistory.objects.create(
                user=user,
                question=question,
                answer=answer,
                feedback=feedback
            )
            return JsonResponse({'success': True, 'id': interview_history.id})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)


class InterviewFeedbackView(LoginRequiredMixin, TemplateView):
    """面接履歴表示ページ"""

    template_name = 'support/interview_feedback.html'
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        user = self.request.user
        # 検索クエリの取得
        query = self.request.GET.get('q', '')

        # ユーザーの面接履歴を取得
        # フィルタ処理
        histories = InterviewHistory.objects.filter(user=user)
        context['empty'] = not histories.exists()
        if query:
            histories = histories.filter(
                Q(question__icontains=query) |
                Q(answer__icontains=query) |
                Q(feedback__icontains=query)
            )

        context['interview_histories'] = histories.order_by('-created_at')
        return context


class InterviewTemplateView(TemplateView):
    """面接テンプレートページ"""

    template_name = 'support/interview_template.html'


    