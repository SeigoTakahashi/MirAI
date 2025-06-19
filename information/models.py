from django.db import models
from accounts.models import CustomUser

class Company(models.Model):
    """会社情報モデル"""
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="companies", verbose_name="ユーザー")
    name = models.CharField(max_length=200, verbose_name="会社名")
    ceo = models.CharField(max_length=200, verbose_name="取締役代表")
    address = models.CharField(max_length=300, verbose_name="本社所在地")
    established_year = models.CharField(max_length=100, verbose_name="設立年度")
    capital = models.CharField(max_length=100, verbose_name="資本金")
    employees_count = models.CharField(max_length=100, verbose_name="従業員数")
    business_content = models.TextField(max_length=600, verbose_name="事業内容")
    official_website = models.URLField(max_length=200, verbose_name="公式HP")
    

    def __str__(self):
        return self.name


class CustomField(models.Model):
    """会社情報のカスタムフィールドモデル"""
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="custom_fields")
    field_name = models.CharField(max_length=100, verbose_name="項目名")
    field_value = models.CharField(max_length=255, verbose_name="値")

    def __str__(self):
        return f"{self.field_name}: {self.field_value}"

class Step(models.Model):
    """選考ステップモデル"""
    name = models.CharField(max_length=255)
    description = models.CharField(max_length=255)
    order = models.PositiveIntegerField()

    # ソート
    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.name

class Progress(models.Model):
    """進捗モデル"""
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    current_step = models.ForeignKey(Step, on_delete=models.SET_NULL, null=True, blank=True, related_name='current_for')
    selected_steps = models.ManyToManyField(Step, related_name='selected_for')

    def __str__(self):
        return f"{self.user} - {self.company.name} - Progress"

    # 選択中のステップを取得
    def get_ordered_selected_steps(self):
        return self.selected_steps.all().order_by('order')

    # 完了済みのステップを取得
    def get_completed_steps(self):
        if self.current_step:
            return self.get_ordered_selected_steps().filter(order__lt=self.current_step.order)
        return self.get_ordered_selected_steps().none()
