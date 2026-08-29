from fastapi.testclient import TestClient

from main import app


client = TestClient(app)


def test_root_reports_model_free_service_health():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"service": "financial-analysis-api", "status": "ok", "mode": "model-free"}


def test_health_does_not_require_model_artifacts():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "mode": "model-free", "models_loaded": False}


def test_predict_internal_preserves_received_payload():
    payload = {"usuarioId": "USR-CI-001", "transacciones": []}
    response = client.post("/predict-internal", json=payload)
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["received"] == payload
