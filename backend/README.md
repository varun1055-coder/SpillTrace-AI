# SpillTrace AI — Backend

FastAPI backend for the SpillTrace AI maritime forensic intelligence platform.

## Setup

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

On first startup the SQLite database is initialized with the operational dataset for the
current investigation environment (investigations, vessels, trajectories, drift simulations,
attribution results, evidence records, and data sources).

Interactive docs: `http://127.0.0.1:8000/api/v1/docs`

## Layout

- `app/api/routes/` — thin REST handlers; no business logic
- `app/services/` — domain logic behind interfaces (`spill_detection`, `drift_model`,
  `attribution`, `counterfactual`, `reporting`, `ais`, `vessel_analysis`)
- `app/services/factory.py` — selects mock vs. real implementations via `USE_MOCK_MODELS`
- `app/repositories/` — persistence; swappable for PostGIS-backed implementations
- `app/models/` — SQLAlchemy entities with UUID primary keys and GeoJSON-compatible fields
- `app/schemas/` — Pydantic API contracts
- `app/data/mock/seed.py` — seed dataset for local development and test bootstrap

## Tests

```powershell
pytest tests/ -v
```

## Switching to PostgreSQL/PostGIS

Set `DATABASE_URL=postgresql://user:pass@host:5432/spilltrace` in `.env`. Geometry is
currently stored as GeoJSON-compatible JSON columns; repositories isolate persistence so
spatial columns/indexes can be introduced without touching routes or services.
