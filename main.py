"""Repository-level FastAPI entrypoint.

Keeps ``uvicorn main:app`` working from the repository root. The existing
model-backed API is preferred when it loads; otherwise a model-free app is
exposed for infrastructure and integration tests.
"""

from __future__ import annotations

import importlib
import logging
import os
from typing import Any, Dict, Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

logger = logging.getLogger(__name__)


def _fallback_app(reason: Optional[Exception] = None) -> FastAPI:
    """Create an API usable when optional model assets are absent."""
    if reason is not None:
        logger.warning("Model-backed API unavailable; using model-free mode: %s", reason)

    fallback = FastAPI(
        title="Financial Analysis API",
        version="0.1.0",
        description="Model-free test mode; trained models are optional.",
    )
    fallback.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @fallback.get("/")
    def root() -> Dict[str, str]:
        return {"service": "financial-analysis-api", "status": "ok", "mode": "model-free"}

    @fallback.get("/health")
    def health() -> Dict[str, Any]:
        return {"status": "ok", "mode": "model-free", "models_loaded": False}

    @fallback.post("/predict-internal")
    def predict_internal(payload: Dict[str, Any]) -> Dict[str, Any]:
        """Network-test contract that remains available without model files."""
        return {
            "status": "ok",
            "mode": "model-free",
            "models_loaded": False,
            "message": "Request received; enable ENABLE_MODEL_API=1 for real inference.",
            "received": payload,
        }

    return fallback


if os.getenv("ENABLE_MODEL_API", "1").lower() in {"1", "true", "yes"}:
    try:
        _model_module = importlib.import_module("data_science.main")
        app = getattr(_model_module, "app")
    except Exception as exc:  # optional model/data dependencies must not block startup
        app = _fallback_app(exc)
else:
    app = _fallback_app()
