"""Service factory — returns mock or real implementations based on config."""
from app.core.config import settings
from app.services.spill_detection.mock import MockSpillDetector
from app.services.spill_detection.real import DeepLearningSpillDetector
from app.services.drift_model.mock import MockDriftModel
from app.services.drift_model.real import OceanParcelsDriftModel
from app.services.attribution.mock import MockAttributionEngine
from app.services.attribution.real import MultiEvidenceAttributionEngine
from app.services.counterfactual.base import MockCounterfactualSimulator
from app.services.counterfactual.real import OceanDriftSimulator
from app.services.reporting.mock import MockReportGenerator
from app.services.reporting.real import StructuredReportGenerator


def get_spill_detector():
    if settings.USE_MOCK_MODELS:
        return MockSpillDetector()
    return DeepLearningSpillDetector()


def get_drift_model():
    if settings.USE_MOCK_MODELS:
        return MockDriftModel()
    return OceanParcelsDriftModel()


def get_attribution_engine():
    if settings.USE_MOCK_MODELS:
        return MockAttributionEngine()
    return MultiEvidenceAttributionEngine()


def get_counterfactual_simulator():
    if settings.USE_MOCK_MODELS:
        return MockCounterfactualSimulator()
    return OceanDriftSimulator()


def get_report_generator():
    if settings.USE_MOCK_MODELS:
        return MockReportGenerator()
    return StructuredReportGenerator()
