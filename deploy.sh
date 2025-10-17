#!/usr/bin/env bash
set -euo pipefail

APP_NAME=${APP_NAME:-transaction-chain}
IMAGE_TAG=${IMAGE_TAG:-latest}
IMAGE_REGISTRY=${IMAGE_REGISTRY:-image-registry.openshift-image-registry.svc:5000}

if ! command -v oc >/dev/null 2>&1; then
  echo "oc CLI is required but not found" >&2
  exit 1
fi

KUBERNETES_NAMESPACE=$(oc project -q)
IMAGE="${IMAGE_REGISTRY}/${KUBERNETES_NAMESPACE}/${APP_NAME}:${IMAGE_TAG}"

echo "⚙️ Using namespace: ${KUBERNETES_NAMESPACE}"

declare -a BUILDERS=(podman docker)
BUILDER=""
for candidate in "${BUILDERS[@]}"; do
  if command -v "$candidate" >/dev/null 2>&1; then
    BUILDER=$candidate
    break
  fi
 done

if [[ -z "$BUILDER" ]]; then
  echo "Neither podman nor docker is available to build the container image" >&2
  exit 1
fi

echo "🐳 Building image with ${BUILDER}: ${IMAGE}"
"${BUILDER}" build -t "${IMAGE}" .

echo "📤 Pushing image to OpenShift internal registry"
"${BUILDER}" push "${IMAGE}"

echo "🚀 Deploying Knative resources"
TMP_SERVICE=$(mktemp)
trap 'rm -f "$TMP_SERVICE"' EXIT

sed "s#{{IMAGE}}#${IMAGE}#g" k8s/service.yaml > "$TMP_SERVICE"

oc apply -f "$TMP_SERVICE"
oc apply -f k8s/broker.yaml
oc apply -f k8s/triggers.yaml
oc apply -f k8s/curler.yaml

trap - EXIT
rm -f "$TMP_SERVICE"

echo "✅ Deployment completed"
