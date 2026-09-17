"""Smoke tests for the SpillTrace AI API surface.

Uses FastAPI's TestClient against the real app and validates the production API contract.
"""
import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def test_root(client):
    res = client.get("/")
    assert res.status_code == 200
    body = res.json()
    assert body["name"] == "SpillTrace AI"
    assert body["status"] == "operational"


def test_health(client):
    res = client.get("/api/v1/health")
    assert res.status_code == 200


def test_dashboard(client):
    res = client.get("/api/v1/dashboard")
    assert res.status_code == 200
    body = res.json()
    assert len(body["kpis"]) >= 4
    assert body["is_seed_data"] is False
    assert len(body["map_data"]["spills"]) >= 1
    assert len(body["map_data"]["vessels"]) >= 1


def test_investigations_list_and_detail(client):
    res = client.get("/api/v1/investigations")
    assert res.status_code == 200
    body = res.json()
    assert body["total"] >= 5

    inv_id = body["items"][0]["id"]
    res = client.get(f"/api/v1/investigations/{inv_id}")
    assert res.status_code == 200
    assert res.json()["id"] == inv_id


def test_investigation_not_found(client):
    res = client.get("/api/v1/investigations/does-not-exist")
    assert res.status_code == 404


def test_spills(client):
    res = client.get("/api/v1/spills")
    assert res.status_code == 200
    body = res.json()
    assert body["total"] >= 1
    spill = body["items"][0]
    assert spill["area_km2"] > 0
    assert len(spill["polygon_coordinates"]) >= 3


def test_vessels_and_trajectory(client):
    res = client.get("/api/v1/vessels")
    assert res.status_code == 200
    body = res.json()
    assert body["total"] >= 10

    vessel_id = body["items"][0]["id"]
    res = client.get(f"/api/v1/vessels/{vessel_id}/trajectory")
    assert res.status_code == 200
    assert "trajectories" in res.json()


def test_drift_simulate_and_fetch(client):
    inv_id = client.get("/api/v1/investigations").json()["items"][0]["id"]
    res = client.post("/api/v1/drift/simulate", json={"investigation_id": inv_id})
    assert res.status_code == 201
    sim = res.json()
    assert sim["origin_probability"] > 0
    assert sim["origin_uncertainty_km"] > 0
    assert "probability_zones" in sim

    res = client.get(f"/api/v1/drift/{sim['id']}")
    assert res.status_code == 200


def test_attribution_analyze(client):
    inv_id = client.get("/api/v1/investigations").json()["items"][0]["id"]
    res = client.post("/api/v1/attribution/analyze", json={"investigation_id": inv_id})
    assert res.status_code == 201
    body = res.json()
    assert len(body["candidates"]) >= 1
    top = body["candidates"][0]
    assert top["rank"] == 1
    assert 0 <= top["overall_score"] <= 100
    assert len(top["evidence_bullets"]) >= 1


def test_evidence_and_data_sources(client):
    res = client.get("/api/v1/evidence")
    assert res.status_code == 200
    assert res.json()["total"] >= 1

    res = client.get("/api/v1/data-sources")
    assert res.status_code == 200
    sources = res.json()
    assert len(sources) >= 4
    categories = {s["category"].lower() for s in sources}
    assert any("satellite" in c or "sar" in c for c in categories)


def test_report_generation(client):
    inv_id = client.get("/api/v1/investigations").json()["items"][0]["id"]
    res = client.post("/api/v1/reports", json={"investigation_id": inv_id})
    assert res.status_code == 201
    report = res.json()
    assert report["overall_confidence"] > 0
    assert report["sections"]
    assert "probabilistic" in report["disclaimer"].lower() or "not" in report["disclaimer"].lower()
