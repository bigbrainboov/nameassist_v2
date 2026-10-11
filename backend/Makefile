.PHONY: up down migrate shell test check make-migrations

up:
	docker compose up --build -d

down:
	docker compose down

make-migrations:
	docker compose exec web python manage.py makemigrations

migrate:
	docker compose exec web python manage.py migrate

shell:
	docker compose exec web python manage.py shell

test:
	docker compose exec web python manage.py test

check:
	docker compose exec web python manage.py check
# SIRI.DEV
