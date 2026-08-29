#!/usr/bin/env bash
set -euo pipefail

# Publishes the model bundle as a versioned generic artifact. Authentication is
# intentionally delegated to gcloud (ADC, service account, or workload identity).

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MODEL_DIR="${MODEL_DIR:-${ROOT_DIR}/data_science/models}"
PROJECT_ID="${PROJECT_ID:?Set PROJECT_ID}"
LOCATION="${ARTIFACT_REGISTRY_LOCATION:?Set ARTIFACT_REGISTRY_LOCATION}"
REPOSITORY="${ARTIFACT_REGISTRY_REPOSITORY:?Set ARTIFACT_REGISTRY_REPOSITORY}"
PACKAGE="${ARTIFACT_REGISTRY_PACKAGE:-financeai-models}"
VERSION="${MODEL_VERSION:-$(date -u +%Y%m%d.%H%M%S)}"

for model in clasificador_gastos.pkl perfil_financiero.pkl; do
  test -f "${MODEL_DIR}/${model}" || {
    echo "Missing model: ${MODEL_DIR}/${model}" >&2
    exit 1
  }
done

command -v gcloud >/dev/null || {
  echo "gcloud is required to publish model artifacts" >&2
  exit 1
}

WORK_DIR="$(mktemp -d)"
trap 'rm -rf "${WORK_DIR}"' EXIT

cp "${MODEL_DIR}/clasificador_gastos.pkl" "${MODEL_DIR}/perfil_financiero.pkl" "${WORK_DIR}/"
(cd "${WORK_DIR}" && if command -v sha256sum >/dev/null; then sha256sum *.pkl; else shasum -a 256 *.pkl; fi > SHA256SUMS && tar -czf "${PACKAGE}-${VERSION}.tar.gz" *.pkl SHA256SUMS)

gcloud artifacts generic upload "${WORK_DIR}/${PACKAGE}-${VERSION}.tar.gz" \
  --project="${PROJECT_ID}" \
  --location="${LOCATION}" \
  --repository="${REPOSITORY}" \
  --package="${PACKAGE}" \
  --version="${VERSION}"

echo "Published ${PACKAGE}@${VERSION} to Artifact Registry repository ${REPOSITORY} in ${LOCATION}"
