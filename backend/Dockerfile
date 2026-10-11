FROM python:3.12-alpine

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN mkdir /app
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    build-base \
    postgresql-dev \
    gcc \
    python3-dev \
    musl-dev

# Install poetry
RUN pip install poetry>=2.0.0

# Configure poetry
RUN poetry config virtualenvs.create false

# Copy dependencies
COPY pyproject.toml poetry.lock* /app/

# Install dependencies
RUN poetry install --no-interaction --no-ansi --no-root

# Copy project files
COPY . /app/

# Create a non-root user
RUN adduser -D django-user

# Collect static
# RUN python manage.py collectstatic --noinput

USER django-user

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "config.wsgi:application"]
# SIRI.DEV
