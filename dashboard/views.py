from django.views.generic import TemplateView, View
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from .forms import EventForm
from .models import Event
from information.models import Progress

class TitleView(TemplateView):
    template_name = 'dashboard/title.html'

class DashboardView(LoginRequiredMixin, TemplateView):
    """ダッシュボードページ"""

    template_name = 'dashboard/dashboard.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        progresses = Progress.objects.select_related('company', 'current_step').filter(user=self.request.user).order_by('company__id')
        context['progresses'] = progresses
        return context

class EventListAPI(LoginRequiredMixin, View):
    def get(self, request):
        events = Event.objects.filter(user=request.user)
        data = [{
            'id': e.id,
            'title': e.title,
            'start': e.start.isoformat(),
            'end': e.end.isoformat() if e.end else None,
            'allDay': e.all_day,
            'extendedProps': {
                'description': e.description,
                'company_id': e.company.id if e.company else '',
                'company_name': e.company.name if e.company else '',
            },
            'color': e.color,
        } for e in events]
        return JsonResponse(data, safe=False)

@method_decorator(csrf_exempt, name='dispatch')
class EventCreateAPI(LoginRequiredMixin, View):
    def post(self, request):
        form = EventForm(request.POST, user=request.user)
        if form.is_valid():
            event = form.save(commit=False)
            event.user = request.user
            event.save()
            return JsonResponse({'success': True})
        return JsonResponse({'success': False, 'errors': form.errors}, status=400)

@method_decorator(csrf_exempt, name='dispatch')
class EventUpdateAPI(LoginRequiredMixin, View):
    def post(self, request, pk):
        try:
            event = Event.objects.get(pk=pk, user=request.user)
        except Event.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Event not found'}, status=404)
        form = EventForm(request.POST, instance=event, user=request.user)
        if form.is_valid():
            form.save()
            return JsonResponse({'success': True})
        return JsonResponse({'success': False, 'errors': form.errors}, status=400)

@method_decorator(csrf_exempt, name='dispatch')
class EventDeleteAPI(LoginRequiredMixin, View):
    def post(self, request, pk):
        try:
            event = Event.objects.get(pk=pk, user=request.user)
            event.delete()
            return JsonResponse({'success': True})
        except Event.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Event not found'}, status=404)
