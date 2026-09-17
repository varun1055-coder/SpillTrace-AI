from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.data.mock.seed import init_db
from app.api.routes import (
    health,
    dashboard,
    investigations,
    spills,
    vessels,
    drift,
    attribution,
    evidence,
    reports,
    data_sources,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        "AI-powered maritime forensic intelligence platform. "
        "Detect marine oil spills, reconstruct probable origins, and rank candidate source vessels."
    ),
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api = FastAPI()
prefix = settings.API_V1_STR

app.include_router(health.router, prefix=prefix)
app.include_router(dashboard.router, prefix=prefix)
app.include_router(investigations.router, prefix=prefix)
app.include_router(spills.router, prefix=prefix)
app.include_router(vessels.router, prefix=prefix)
app.include_router(drift.router, prefix=prefix)
app.include_router(attribution.router, prefix=prefix)
app.include_router(evidence.router, prefix=prefix)
app.include_router(reports.router, prefix=prefix)
app.include_router(data_sources.router, prefix=prefix)


@app.get("/")
def root():
    return {
        "name": settings.PROJECT_NAME,
        "tagline": settings.PROJECT_TAGLINE,
        "version": settings.VERSION,
        "docs": f"{settings.API_V1_STR}/docs",
        "status": "operational",
    }
