from django import forms

class EmailCreateForm(forms.Form):
    """メール作成フォーム"""

    def __init__(self, *args, **kwargs):
        kwargs.setdefault('label_suffix', '')  # コロン除去
        super().__init__(*args, **kwargs)
    
    recipient = forms.CharField(
        label='相手の名前',
        max_length=100,
        required=True,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': '相手の名前を入力'})
    )
    company = forms.CharField(
        label='会社名',
        max_length=100,
        required=True,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': '会社名を入力'})
    )
    sender_name = forms.CharField(
        label='自分の名前',
        max_length=100,
        required=True,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': '自分の名前を入力'})
    )
    subject = forms.CharField(
        label='件名（任意）',
        max_length=200,
        required=False,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': '件名を入力'})
    )
    content = forms.CharField(
        label='書きたい内容',
        required=True,
        widget=forms.Textarea(attrs={'class': 'form-control auto-resize', 'placeholder': 'メール内容の概要を入力', 'rows': 1})
    )

class EmailReplyForm(forms.Form):
    """"メール返信作成フォーム"""

    def __init__(self, *args, **kwargs):
        kwargs.setdefault('label_suffix', '')  # コロン除去
        super().__init__(*args, **kwargs)

    originalEmail = forms.CharField(
        label='返信したいメール',
        widget=forms.Textarea(attrs={
            'class': 'form-control auto-resize',
            'placeholder': '返信対象のメール内容を入力',
            'rows': 1
        }),
        required=True
    )

    content = forms.CharField(
        label='書きたい内容',
        widget=forms.Textarea(attrs={
            'class': 'form-control auto-resize',
            'placeholder': '返信内容の概要を入力',
            'rows': 1
        }),
        required=True
    )

class EmailStructureCheckForm(forms.Form):
    """メール構成チェックフォーム"""

    def __init__(self, *args, **kwargs):
        kwargs.setdefault('label_suffix', '')  # コロン除去
        super().__init__(*args, **kwargs)

    emailContent = forms.CharField(
        label='チェックしたいメール',
        widget=forms.Textarea(attrs={
            'class': 'form-control auto-resize',
            'placeholder': 'チェックしたいメール内容を入力',
            'rows': 1,
        }),
        required=True
    )