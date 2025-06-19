from django.views.generic import FormView, TemplateView
from django.shortcuts import render
from .forms import JobdocsCreateForm, JobdocsCheckForm
from accounts.models import Profile
from mail.utils import generate_text
from accounts.utils import get_user_display_name
from information.models import Progress

class JobdocsCreateView(FormView):
    """履歴書・ES作成ページ"""

    template_name = "jobdocs/jobdocs_create.html"
    form_class = JobdocsCreateForm

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs['user'] = self.request.user  # フォームにユーザーを渡す
        return kwargs
    
    def form_valid(self, form):
        # 入力データの取得
        theme = form.cleaned_data['theme']
        max_length = form.cleaned_data['max_length']
        detail = form.cleaned_data['detail']
        selected_company = form.cleaned_data.get('company')

        base_info = []

        user = self.request.user

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
        # 未ログイン or プロフィールなしなら base_info は空のまま

        # プロンプト生成
        prompt = f"""
        あなたは就職活動における履歴書やエントリーシートの文章を作成するプロフェッショナルです。
        以下の情報をもとに、「{theme}」というテーマに沿って文章を作成してください。

        【必須出力条件】
        - 出力は日本語の文章のみとし、記号や説明は一切不要です。
        - 全角{max_length}文字以内で、{max_length}文字を1文字でも超えてはいけません。
        - 全角{int(max_length * 0.9)}文字未満も不可とします。必ず{int(max_length * 0.9)}文字以上、{max_length}文字以内に収めてください。
        - 改行、空白、句読点も文字数に含めてください。
        - 就職活動で使用できる丁寧な文体を使い、文法的に自然な日本語で書いてください。
        - 内容には具体性と一貫性を持たせ、薄くならないようにしてください。
        - 文字数調整のために無意味な言い換えや水増しをしてはいけません。

        この条件を厳密に守って文章を作成してください。
        """


        for label, value in base_info:
            if value:
                prompt += f"【{label}】{value}\n"

        # 会社情報の追加
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

            prompt += "\n【企業情報】\n"
            for label, value in company_info:
                if value:
                    prompt += f"{label}: {value}\n"

            # カスタムフィールドも追加
            custom_fields = selected_company.custom_fields.all()
            if custom_fields.exists():
                prompt += "\n【カスタム項目】\n"
                for field in custom_fields:
                    if field.field_name and field.field_value:
                        prompt += f"{field.field_name}: {field.field_value}\n"

        prompt += f"【さらに盛り込みたい内容】{detail}"

        # GEMINI APIを使用して文を生成
        try:
            result = generate_text(prompt)
        except Exception as e:
            return render(self.request, 'generation_error.html')

        # contextに結果を追加して再描画
        return self.render_to_response(self.get_context_data(
            form=form,
            result=result
        ))

    def form_invalid(self, form):
        # エラー時もフォームを維持
        return self.render_to_response(self.get_context_data(form=form))

class JobdocsCheckView(FormView):
    """メール構成チェックページ"""

    template_name = 'jobdocs/jobdocs_check.html'
    form_class = JobdocsCheckForm

    def form_valid(self, form):
        contents = form.cleaned_data['contents']

        # プロンプト生成 
        prompt = f"""
        以下は、就職活動における履歴書・エントリーシートに記載された文章です。
        この内容が以下の観点で適切かどうか確認してください。

        【チェック観点】
        1. 構成（起承転結・論理の流れ）は就活書類として自然か。
        2. 表現（敬語、謙譲語、尊敬語など）は適切か。
        3. 言葉遣いや用語の選び方（例：「貴社」と「御社」の使い分け、「御社」は話し言葉（口語）で「貴社」は書き言葉（文語）、今回は書き言葉（文語））は問題ないか。
        4. 内容に曖昧な表現、論理の飛躍、不自然な主張がないか。

        【出力条件】
        - 問題がある場合は、**改善点のみを簡潔に箇条書きで**出力してください（箇条書き以外の出力は禁止）。
        - 問題がなければ、「適切な文章です。」とだけ出力してください（他の出力は禁止）。
        - 原文の要約や言い換えは不要です。
        - 就活生による提出文書であることを前提としてください。

        【確認対象】
        {contents}
        """

        # GEMINI APIを使用して文を生成
        try:
            result = generate_text(prompt)
        except Exception as e:
            return render(self.request, 'generation_error.html')

        # contextに結果を追加して再描画
        return self.render_to_response(self.get_context_data(form=form, result=result))

    def form_invalid(self, form):
        # エラー時もフォームを維持
        return self.render_to_response(self.get_context_data(form=form))


class JobdocsTemplateView(TemplateView):
    """履歴書テンプレートページ"""

    template_name = 'jobdocs/jobdocs_template.html'

class JobdocsEditView(TemplateView):
    """履歴書PDF編集ページ"""

    template_name = 'jobdocs/jobdocs_edit.html'


    