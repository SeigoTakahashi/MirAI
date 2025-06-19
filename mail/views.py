from django.views.generic import TemplateView, FormView
from django.shortcuts import render
from .forms import EmailCreateForm, EmailReplyForm, EmailStructureCheckForm
from .utils import generate_text

class EmailCreate(FormView):
    """メール作成ページ"""

    template_name = 'mail/email_create.html'
    form_class = EmailCreateForm
    def form_valid(self, form):
        # 入力データの取得
        recipient = form.cleaned_data['recipient']
        company = form.cleaned_data['company']
        sender_name = form.cleaned_data['sender_name']
        subject = form.cleaned_data.get('subject', '')
        content = form.cleaned_data['content']

        # プロンプト生成
        prompt = f"""
        以下の情報をもとに、就職活動中の学生として適切な形式の丁寧なビジネスメール文を作成してください。

        【宛先】
        - 宛先：{company} {recipient} 様

        【要素】
        - 件名：{subject if subject else "※件名が未入力の場合は、内容に即した適切な件名を自動生成してください"}
        - 自分の名前：{sender_name}
        - メール本文に盛り込みたい内容：{content}

        【出力形式】
        1. 件名（「件名：」から始める）
        2. 本文（宛先の氏名を文頭に含めること）
        3. 結びに署名として自分の名前（{sender_name}）を記載すること

        【出力条件】
        - 出力は件名とメール本文のみとし、その他の注釈や補足は一切含めないこと。
        - 学生らしく、誠実で丁寧な文面にしてください。
        - 自然な敬語と適切な段落構成を用いてください。
        """
        # GEMINI APIを使用してメール文を生成
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

class EmailReplyCreate(FormView):
    """メール返信作成ページ"""

    template_name = 'mail/email_reply_create.html'
    form_class = EmailReplyForm

    def form_valid(self, form):
        original = form.cleaned_data['originalEmail']
        content = form.cleaned_data['content']

        # プロンプト生成
        prompt = f"""
        以下の情報をもとに、就職活動中の学生として適切かつ丁寧な返信メール文を作成してください。

        【前提】
        - これは受信したビジネスメールへの返信です。
        - 学生としての誠実な姿勢が伝わるようにしてください。
        - 自然な敬語、わかりやすい段落構成を使用してください。

        【入力情報】
        - 受信メールの本文（引用）：{original}
        - 返信メールに盛り込みたい内容：{content}

        【出力形式】
        1. 件名（「件名：」から始める）※原則「Re:」を用いるが、適切に調整すること。
        2. 本文（文頭に相手の名前や役職を含めて敬称をつける）

        【出力ルール】
        - 出力は件名と本文のみとし、それ以外の補足説明は一切出力しないこと。
        - 引用元のメールを文中に再掲しない（あくまで内容をふまえて返信する）。
        - 誠実かつ礼儀正しい文面にすること。
        """
        # GEMINI APIを使用してメール文を生成
        try:
            result = generate_text(prompt)
        except Exception as e:
            return render(self.request, 'generation_error.html')

        # contextに結果を追加して再描画
        return self.render_to_response(self.get_context_data(form=form, reply_text=result))

    def form_invalid(self, form):
        # エラー時もフォームを維持
        return self.render_to_response(self.get_context_data(form=form))

class EmailStructureCheck(FormView):
    """メール構成チェックページ"""

    template_name = 'mail/email_structure_check.html'
    form_class = EmailStructureCheckForm

    def form_valid(self, form):
        emailContent = form.cleaned_data['emailContent']

        # プロンプト生成
        prompt = f"""
        以下のメール文が、就職活動におけるビジネスメールとして適切な構成・表現になっているかを確認してください。

        【チェックポイント】
        - 敬語の適切さ（例：「ご担当者様」「承知いたしました」など）
        - 宛名の有無と正確さ（敬称が適切かも含める）
        - 挨拶文や結びの表現
        - 署名（名前が正しくあるか）
        - 全体として学生としてふさわしい丁寧な文面になっているか

        【出力ルール】
        - 不適切な点がある場合は、**改善点のみを簡潔に箇条書きで**出力してください（改善案や冗長な説明は不要です）。
        - 問題がなければ、**「適切です。」**の1文のみを出力してください。
        - 評価コメントや補足説明など、それ以外は一切出力してはいけません。
        - 対象は**就職活動中の学生が送るメール**であることを前提に評価してください。

        【メール本文】
        {emailContent}
        """

        # GEMINI APIを使用してメール文を生成
        try:
            result = generate_text(prompt)
        except Exception as e:
            return render(self.request, 'generation_error.html')

        # contextに結果を追加して再描画
        return self.render_to_response(self.get_context_data(form=form, result=result))

    def form_invalid(self, form):
        # エラー時もフォームを維持
        return self.render_to_response(self.get_context_data(form=form))


class EmailTemplate(TemplateView):
    """メールテンプレートページ"""

    template_name = 'mail/email_template.html'

    