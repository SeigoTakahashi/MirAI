from django import forms
from information.models import Company

class JobdocsCreateForm(forms.Form):
    """ 履歴書・ES作成フォームクラス """
    theme = forms.CharField(
        label="テーマ",
        max_length=100,
        required=True,
        widget=forms.Textarea(attrs={'rows': 1, 'class': 'form-control auto-resize', 'placeholder': '書くテーマを入力'})
    )

    max_length = forms.IntegerField(
        label="最大文字数",
        max_value=1000,
        min_value=1,
        required=True,
        widget=forms.NumberInput(attrs={'class': 'form-control', 'placeholder': '最大文字数を入力'})
    )

    detail = forms.CharField(
        label="書きたい内容",
        widget=forms.Textarea(attrs={'rows': 1, 'class': 'form-control auto-resize', 'placeholder': '書く内容の概要を入力'}),
        required=True
    )

    company = forms.ModelChoiceField(
        label="会社情報を含める（任意）",
        queryset=Company.objects.none(), 
        required=False,
        widget=forms.Select(attrs={'class': 'form-control'})
    )

    def __init__(self, *args, **kwargs):
        user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)
        if user and user.is_authenticated:
            self.fields['company'].queryset = Company.objects.filter(user=user)
        else:
            self.fields['company'].queryset = Company.objects.none()


class JobdocsCheckForm(forms.Form):
    """ 履歴書・ES添削フォームクラス """
    
    contents = forms.CharField(
        label="添削したい内容",
        widget=forms.Textarea(attrs={'rows': 1, 'class': 'form-control auto-resize', 'placeholder': '添削したい内容を入力', 'id': 'jobdocTextarea'}),
        required=True
    )