#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST_DIR="${MODEL_DIR:-${ROOT_DIR}/data_science/models}"
PROJECT_ID="${PROJECT_ID:?Set PROJECT_ID}"
LOCATION="${ARTIFACT_REGISTRY_LOCATION:?Set ARTIFACT_REGISTRY_LOCATION}"
REPOSITORY="${ARTIFACT_REGISTRY_REPOSITORY:?Set ARTIFACT_REGISTRY_REPOSITORY}"
PACKAGE="${ARTIFACT_REGISTRY_PACKAGE:-financeai-models}"
VERSION="${MODEL_VERSION:?Set MODEL_VERSION (an immutable artifact version)}"

command -v gcloud >/dev/null || {
  echo "gcloud is required to download model artifacts" >&2
  exit 1
}

WORK_DIR="$(mktemp -d)"
trap 'rm -rf "${WORK_DIR}"' EXIT

gcloud artifacts generic download \
  --project="${PROJECT_ID}" \
  --location="${LOCATION}" \
  --repository="${REPOSITORY}" \
  --package="${PACKAGE}" \
  --version="${VERSION}" \
  --destination="${WORK_DIR}"

ARCHIVE="$(find "${WORK_DIR}" -maxdepth 1 -type f -name '*.tar.gz' -print -quit)"
test -n "${ARCHIVE}" || { echo "No model archive found in the artifact" >&2; exit 1; }

tar -xzf "${ARCHIVE}" -C "${WORK_DIR}"
(cd "${WORK_DIR}" && if command -v sha256sum >/dev/null; then sha256sum -c SHA256SUMS; else shasum -a 256 -c SHA256SUMS; fi)

mkdir -p "${DEST_DIR}"
cp "${WORK_DIR}/clasificador_gastos.pkl" "${WORK_DIR}/perfil_financiero.pkl" "${WORK_DIR}/SHA256SUMS" "${DEST_DIR}/"
echo "Downloaded ${PACKAGE}@${VERSION} into ${DEST_DIR}"
