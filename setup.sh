#!/bin/bash

# install dependancies
pip install setuptools
pip install -r requirements.txt

# Run django commands
python manage.py makemigrations --noinput
python manage.py migrate --noinput
python manage.py collectstatic --clear --noinput