from app.core.config import settings
from app.services.factory import (
    get_spill_detector,
    get_drift_model,
    get_attribution_engine,
    get_counterfactual_simulator,
    get_report_generator,
)


def test_factory_uses_real_service_implementations_when_mock_disabled(monkeypatch):
    monkeypatch.setattr(settings, "USE_MOCK_MODELS", False)

    assert get_spill_detector().__class__.__name__ == "DeepLearningSpillDetector"
    assert get_drift_model().__class__.__name__ == "OceanParcelsDriftModel"
    assert get_attribution_engine().__class__.__name__ == "MultiEvidenceAttributionEngine"
    assert get_counterfactual_simulator().__class__.__name__ == "OceanDriftSimulator"
    assert get_report_generator().__class__.__name__ == "StructuredReportGenerator"
