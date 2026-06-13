AZURE_RESOURCE_GROUP ?= rg-hmd-secure-crm
AZURE_LOCATION ?= swedencentral
AZURE_ENVIRONMENT ?= hmd-secure-crm-env
AZURE_REGISTRY ?= cab114eef619acr
AZURE_APP ?= hmd-secure-crm

.PHONY: build up down restart reup logs dev clean deploy deploy-url

build:
	docker compose build

up:
	docker compose up -d

down:
	docker compose down

restart: down up

reup: build up

logs:
	docker compose logs -f

dev:
	bunx astro dev --host 0.0.0.0

clean: down
	docker compose down --rmi all -v

deploy:
	AZURE_RESOURCE_GROUP="$(AZURE_RESOURCE_GROUP)" \
	AZURE_LOCATION="$(AZURE_LOCATION)" \
	AZURE_ENVIRONMENT="$(AZURE_ENVIRONMENT)" \
	AZURE_REGISTRY="$(AZURE_REGISTRY)" \
	AZURE_APP="$(AZURE_APP)" \
	./scripts/deploy-azure.sh

deploy-url:
	@printf 'https://%s\n' "$$(az containerapp show \
		--name "$(AZURE_APP)" \
		--resource-group "$(AZURE_RESOURCE_GROUP)" \
		--query properties.configuration.ingress.fqdn \
		--output tsv)"
