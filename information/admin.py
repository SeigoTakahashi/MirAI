from django.contrib import admin
from .models import Company, CustomField, Step, Progress

admin.site.register(Company)
admin.site.register(CustomField)
admin.site.register(Step)
admin.site.register(Progress)

