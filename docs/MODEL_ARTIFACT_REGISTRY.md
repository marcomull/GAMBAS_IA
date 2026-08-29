# Model artifacts in Google Artifact Registry

The two inference models are published together as one versioned generic artifact. The archive contains both `.pkl` files and a `SHA256SUMS` checksum file. The data-science service keeps that manifest beside the models and verifies both SHA-256 digests before deserializing anything; startup fails if the manifest is missing or a model has changed.

Create a Generic repository once, then authenticate with `gcloud auth application-default login` (or the service account used by CI):

```bash
gcloud artifacts repositories create financeai-models \
  --repository-format=generic \
  --location=us-central1
```

Publish an immutable version:

```bash
PROJECT_ID=my-project \
ARTIFACT_REGISTRY_LOCATION=us-central1 \
ARTIFACT_REGISTRY_REPOSITORY=financeai-models \
MODEL_VERSION=2026.08.04 \
./scripts/publish-models-to-artifact-registry.sh
```

Restore a version before building or starting the data-science service:

```bash
PROJECT_ID=my-project \
ARTIFACT_REGISTRY_LOCATION=us-central1 \
ARTIFACT_REGISTRY_REPOSITORY=financeai-models \
MODEL_VERSION=2026.08.04 \
./scripts/download-models-from-artifact-registry.sh
```

Local Docker Compose continues to use `data_science/models` directly. Do not use a mutable version such as `latest` for production deployments; pin `MODEL_VERSION` so a deployment can be reproduced.
