#!/usr/bin/env bash

set -euo pipefail

RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-rg-hmd-secure-crm}"
LOCATION="${AZURE_LOCATION:-swedencentral}"
ENVIRONMENT="${AZURE_ENVIRONMENT:-hmd-secure-crm-env}"
REGISTRY="${AZURE_REGISTRY:-cab114eef619acr}"
APP="${AZURE_APP:-hmd-secure-crm}"
OPENCLAW_URL="${OPENCLAW_URL:-}"
OPENCLAW_KEY="${OPENCLAW_KEY:-}"
ASSISTANT_MODEL="${ASSISTANT_MODEL:-hermes-crm}"
DATABASE_URL="${DATABASE_URL:-}"
TAG="${AZURE_IMAGE_TAG:-$(git rev-parse --short HEAD)-$(date -u +%Y%m%d%H%M%S)}"
REGISTRY_SERVER="${REGISTRY}.azurecr.io"
IMAGE="${REGISTRY_SERVER}/${APP}:${TAG}"

if [[ -z "${OPENCLAW_URL}" || -z "${OPENCLAW_KEY}" || -z "${DATABASE_URL}" ]]; then
  echo "DATABASE_URL, OPENCLAW_URL, and OPENCLAW_KEY must be set for deployment." >&2
  exit 1
fi

for command in az docker curl git; do
  if ! command -v "${command}" >/dev/null 2>&1; then
    echo "Required command not found: ${command}" >&2
    exit 1
  fi
done

if ! az account show >/dev/null 2>&1; then
  echo "Azure CLI is not authenticated. Run: az login" >&2
  exit 1
fi

echo "Registering Azure resource providers..."
az provider register --namespace Microsoft.App --wait >/dev/null
az provider register --namespace Microsoft.ContainerRegistry --wait >/dev/null

echo "Ensuring resource group ${RESOURCE_GROUP} exists in ${LOCATION}..."
az group create \
  --name "${RESOURCE_GROUP}" \
  --location "${LOCATION}" \
  --output none

if ! az containerapp env show \
  --name "${ENVIRONMENT}" \
  --resource-group "${RESOURCE_GROUP}" \
  >/dev/null 2>&1; then
  echo "Creating Container Apps environment ${ENVIRONMENT}..."
  az containerapp env create \
    --name "${ENVIRONMENT}" \
    --resource-group "${RESOURCE_GROUP}" \
    --location "${LOCATION}" \
    --logs-destination none \
    --output none
fi

if ! az acr show --name "${REGISTRY}" >/dev/null 2>&1; then
  echo "Creating container registry ${REGISTRY}..."
  az acr create \
    --name "${REGISTRY}" \
    --resource-group "${RESOURCE_GROUP}" \
    --location "${LOCATION}" \
    --sku Basic \
    --admin-enabled true \
    --output none
else
  az acr update --name "${REGISTRY}" --admin-enabled true --output none
fi

echo "Building ${IMAGE}..."
docker build --tag "${IMAGE}" .

echo "Pushing image to Azure Container Registry..."
az acr login --name "${REGISTRY}" >/dev/null
docker push "${IMAGE}"

REGISTRY_USERNAME="$(az acr credential show --name "${REGISTRY}" --query username --output tsv)"
REGISTRY_PASSWORD="$(az acr credential show --name "${REGISTRY}" --query 'passwords[0].value' --output tsv)"

if az containerapp show \
  --name "${APP}" \
  --resource-group "${RESOURCE_GROUP}" \
  >/dev/null 2>&1; then
  echo "Updating Container App ${APP}..."
  az containerapp registry set \
    --name "${APP}" \
    --resource-group "${RESOURCE_GROUP}" \
    --server "${REGISTRY_SERVER}" \
    --username "${REGISTRY_USERNAME}" \
    --password "${REGISTRY_PASSWORD}" \
    --output none
  az containerapp secret set \
    --name "${APP}" \
    --resource-group "${RESOURCE_GROUP}" \
    --secrets openclaw-key="${OPENCLAW_KEY}" database-url="${DATABASE_URL}" \
    --output none
  az containerapp update \
    --name "${APP}" \
    --resource-group "${RESOURCE_GROUP}" \
    --image "${IMAGE}" \
    --set-env-vars HOST=0.0.0.0 PORT=3000 NODE_ENV=production SESSION_SECRET=hackathon-prod-secret-change-me DATABASE_URL=secretref:database-url OPENCLAW_URL="${OPENCLAW_URL}" OPENCLAW_KEY=secretref:openclaw-key ASSISTANT_MODEL="${ASSISTANT_MODEL}" \
    --min-replicas 0 \
    --max-replicas 1 \
    --output none
else
  echo "Creating Container App ${APP}..."
  az containerapp create \
    --name "${APP}" \
    --resource-group "${RESOURCE_GROUP}" \
    --environment "${ENVIRONMENT}" \
    --image "${IMAGE}" \
    --registry-server "${REGISTRY_SERVER}" \
    --registry-username "${REGISTRY_USERNAME}" \
    --registry-password "${REGISTRY_PASSWORD}" \
    --ingress external \
    --target-port 3000 \
    --secrets openclaw-key="${OPENCLAW_KEY}" database-url="${DATABASE_URL}" \
    --env-vars HOST=0.0.0.0 PORT=3000 NODE_ENV=production SESSION_SECRET=hackathon-prod-secret-change-me DATABASE_URL=secretref:database-url OPENCLAW_URL="${OPENCLAW_URL}" OPENCLAW_KEY=secretref:openclaw-key ASSISTANT_MODEL="${ASSISTANT_MODEL}" \
    --min-replicas 0 \
    --max-replicas 1 \
    --output none
fi

FQDN="$(az containerapp show \
  --name "${APP}" \
  --resource-group "${RESOURCE_GROUP}" \
  --query properties.configuration.ingress.fqdn \
  --output tsv)"
URL="https://${FQDN}"

echo "Waiting for ${URL}..."
curl \
  --fail \
  --silent \
  --show-error \
  --retry 12 \
  --retry-all-errors \
  --retry-delay 5 \
  --max-time 30 \
  "${URL}/" \
  >/dev/null

echo "Deployment ready: ${URL}"
