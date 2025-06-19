from django.views.generic import TemplateView,View, DetailView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import redirect, get_object_or_404
from django.urls import reverse
from .models import Company, CustomField, Step, Progress
from dashboard.models import Event


class InformationView(LoginRequiredMixin, TemplateView):
    """会社情報ページ"""

    template_name = 'information/company_information_list.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        try:
            context['companies'] = Company.objects.filter(user=self.request.user)
        except Company.DoesNotExist:
            context['companies'] = None
        return context


class InformationDetailView(LoginRequiredMixin, DetailView):
    """会社情報詳細ページ"""
    
    model = Company
    context_object_name = 'company'
    template_name = 'information/company_information_detail.html'

    def get_queryset(self):
        """ログインユーザーに紐づくCompanyのみ取得可能"""
        return Company.objects.filter(user=self.request.user)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        company = self.object  # DetailViewが自動で取得してくれたCompany
        context['custom_fields'] = CustomField.objects.filter(company=company)

        # 選考ステップの進捗情報を取得
        progress, created = Progress.objects.get_or_create(user=self.request.user, company=company)

        if created:
            # 初期状態：デフォルトの選択ステップ（固定値 order=1,2,3,4,5）
            default_steps = Step.objects.filter(order__in=[1, 2, 3, 4, 5])
            progress.selected_steps.set(default_steps)

            # current_stepは常にorderが最小のステップから始める
            if default_steps.exists():
                progress.current_step = default_steps.order_by('order').first()
            else:
                progress.current_step = None
            progress.save()

        # 進捗情報を取得
        all_steps = Step.objects.all().order_by('order')
        selected_steps = progress.get_ordered_selected_steps()
        completed_steps = progress.get_completed_steps()
        current_step = progress.current_step
        current_step_index = list(selected_steps).index(current_step) if current_step else 0

        context['progress'] = progress
        context['all_steps'] = all_steps
        context['current_step'] = current_step
        context['selected_steps'] = selected_steps
        context['completed_steps'] = completed_steps
        context['current_step_index'] = current_step_index

        # イベント情報を取得
        events = Event.objects.filter(company=company, user=self.request.user).order_by('start')
        context['events'] = events
        
        return context


class InformationAddView(LoginRequiredMixin, View):
    """会社情報追加ページ"""

    def post(self, request):
        name = request.POST.get('name', '')
        company = Company.objects.create(
            user=request.user,
            name=name,
        )
        return redirect('information:company_information_list')


@method_decorator(csrf_exempt, name='dispatch')
class AddCustomFieldView(LoginRequiredMixin, View):
    """カスタムフィールド追加API"""

    def post(self, request):
        try:
            field_name = request.POST.get('field_name', '')
            field_value = request.POST.get('field_value', '')
            company_id = request.POST.get('company_id', '')

            company = Company.objects.get(id=company_id, user=request.user)

            custom_field = CustomField.objects.create(
                company=company,
                field_name=field_name,
                field_value=field_value
            )
            return JsonResponse({'status': 'success', 'field_id': custom_field.id})
        except Company.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Company not found or permission denied'}, status=404)
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)


@method_decorator(csrf_exempt, name='dispatch')
class CompanyDeleteView(LoginRequiredMixin, View):
    """会社情報削除API"""

    def post(self, request, company_id):
        company = get_object_or_404(Company, id=company_id, user=request.user)
        try:
            company.delete()
            return JsonResponse({'redirect_url': reverse('information:company_information_list')})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class CustomFieldDeleteView(LoginRequiredMixin, View):
    """カスタムフィールド削除API"""

    def post(self, request, *args, **kwargs):
        field_id = request.POST.get("field_id")
        try:
            custom_field = CustomField.objects.get(id=field_id, company__user=request.user)
            custom_field.delete()
            return JsonResponse({'success': True})
        except CustomField.DoesNotExist:
            return JsonResponse({'success': False, 'error': '削除できませんでした。'}, status=403)


@method_decorator(csrf_exempt, name='dispatch')
class InlineUpdateView(LoginRequiredMixin, View):
    """フィールド更新API"""

    def post(self, request, *args, **kwargs):
        model_type = request.POST.get("model")
        field = request.POST.get("field")
        value = request.POST.get("value")

        # 既存フィールドの更新
        if model_type == "company":
            try:
                company = Company.objects.get(id=request.POST.get("id"), user=request.user)
                setattr(company, field, value)
                company.save()
                return JsonResponse({"success": True})
            except Company.DoesNotExist:
                return JsonResponse({"success": False, "error": "会社が見つかりません"}, status=404)

        # カスタムフィールドの更新
        elif model_type == "custom_field":
            try:
                custom_field = CustomField.objects.get(id=request.POST.get("id"), company__user=request.user)
                setattr(custom_field, field, value)
                custom_field.save()
                return JsonResponse({"success": True})
            except CustomField.DoesNotExist:
                return JsonResponse({"success": False, "error": "カスタムフィールドが見つかりません"}, status=404)

        return JsonResponse({"success": False, "error": "不正なリクエスト"}, status=400)


@method_decorator(csrf_exempt, name='dispatch')
class UpdateStepSelectionView(LoginRequiredMixin, View):
    """選考ステップの選択状態を更新するAPI"""

    def post(self, request):
        step_id = int(request.POST.get('step_id'))
        checked = request.POST.get('checked') == 'true'
        company_id = int(request.POST.get('company_id'))

        company = Company.objects.get(user=request.user, id=company_id)
        progress, _ = Progress.objects.get_or_create(user=request.user, company=company)
        step = Step.objects.get(id=step_id)

        if checked:
            progress.selected_steps.add(step)
        else:
            progress.selected_steps.remove(step)

        ordered_steps = progress.get_ordered_selected_steps()
        progress.current_step = ordered_steps.first() if ordered_steps.exists() else None

        progress.save()

        return JsonResponse({"status": "ok"})


@method_decorator(csrf_exempt, name='dispatch')
class UpdateCurrentStepView(LoginRequiredMixin, View):
    """選考ステップの現在のステップを更新するAPI"""

    def post(self, request):
        step_id = int(request.POST.get('step_id'))
        progress_id = int(request.POST.get('progress_id'))

        progress = Progress.objects.get(id=progress_id, user=request.user)
        step = Step.objects.get(id=step_id)

        if step in progress.selected_steps.all():
            progress.current_step = step
            progress.save()
            return JsonResponse({"status": "ok"})
        else:
            return JsonResponse({"status": "error", "message": "選択されていないステップです"}, status=400)
        

@method_decorator(csrf_exempt, name='dispatch')
class ResetCurrentStepView(LoginRequiredMixin, View):
    """現在のステップをリセットするAPI"""

    def post(self, request):
        progress_id = int(request.POST.get('progress_id'))

        progress = Progress.objects.get(id=progress_id, user=request.user)

        ordered_steps = progress.get_ordered_selected_steps()
        progress.current_step = ordered_steps.first() if ordered_steps.exists() else None

        progress.save()

        return JsonResponse({"status": "ok"})