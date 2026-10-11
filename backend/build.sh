#!/usr/bin/env bash
# exit on error
set -o errexit

# Install poetry if not already installed (Render provides pip)
pip install poetry>=2.0.0

# Configure poetry to not create virtualenvs (to install packages directly in the current environment)
poetry config virtualenvs.create false

# Install dependencies using Poetry
poetry install --only main --no-interaction --no-ansi --no-root

# Convert static asset files
python manage.py collectstatic --no-input

# Apply any outstanding database migrations
python manage.py migrate
# SIRI.DEV
