#!/bin/bash
# Deploy PianoQuest Live to Google Cloud Run
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
if [ -f "$PROJECT_ROOT/.env" ]; then
    set -a; source "$PROJECT_ROOT/.env"; set +a
fi

PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-jworks-interpreter-challenge}"
REGION="${GOOGLE_CLOUD_REGION:-us-central1}"
SERVICE_NAME="pianoquest-live"
REPO="pianoquest-live"
IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${SERVICE_NAME}"

echo "=== Deploying ${SERVICE_NAME} to Cloud Run ==="
echo "Project: ${PROJECT_ID}"
echo "Region:  ${REGION}"

gcloud builds submit --tag "${IMAGE}" --project "${PROJECT_ID}" "$PROJECT_ROOT"

gcloud run deploy "${SERVICE_NAME}" \
  --image "${IMAGE}" \
  --platform managed \
  --region "${REGION}" \
  --project "${PROJECT_ID}" \
  --allow-unauthenticated \
  --set-env-vars "GOOGLE_API_KEY=${GOOGLE_API_KEY}" \
  --memory 1Gi \
  --cpu 2 \
  --timeout 300 \
  --max-instances 5 \
  --min-instances 1 \
  --session-affinity

echo ""
echo "=== Deployment complete ==="
URL=$(gcloud run services describe "${SERVICE_NAME}" --region "${REGION}" --project "${PROJECT_ID}" --format "value(status.url)")
echo "Live URL: ${URL}"
echo "Health:   ${URL}/health"
