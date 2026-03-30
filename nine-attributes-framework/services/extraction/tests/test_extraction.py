"""
Tests for Nine Attributes Extraction Service
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch

from src.main import app, NineAttributesExtractor, AttributeScore

client = TestClient(app)


class TestExtraction:
    """Test extraction pipeline"""

    @pytest.fixture
    def extractor(self):
        return NineAttributesExtractor()

    def test_hook_strength_analysis(self, extractor):
        transcript = {
            "text": "Is it possible to gain 10k followers in 30 days? Let me show you exactly how.",
            "segments": [
                {"text": "Is it possible to gain 10k followers in 30 days?", "start": 0, "end": 3}
            ],
        }
        scene_data = {"scene_changes": [0.5, 1.5, 2.5], "cut_rate": 1.0}
        result = extractor.analyze_hook_strength(transcript, scene_data)
        assert result.name == "HookStrength"
        assert result.score >= 7.0
        assert "hook_pattern_question" in result.evidence

    def test_tam_resonance_analysis(self, extractor):
        transcript = {"text": "How to make money online and achieve financial success"}
        metadata = type("Meta", (), {"duration": 45, "width": 1080, "height": 1920})()
        result = extractor.analyze_tam_resonance(transcript, metadata)
        assert result.name == "TAMResonance"
        assert result.score >= 6.0
        assert "universal_topics" in result.evidence
        assert "money" in result.evidence.get("universal_topics", [])

    def test_gate_check_passing(self):
        attributes = [AttributeScore(name=f"Attr{i}", score=8.0, evidence={}) for i in range(9)]
        response = client.post("/api/content/gate", json={"attributes": [a.dict() for a in attributes]})
        assert response.status_code == 200
        data = response.json()
        assert data["pass_gate"] is True
        assert data["total_score"] == 72.0
        assert len(data["reasons"]) == 0

    def test_gate_check_failing(self):
        attributes = [AttributeScore(name=f"Attr{i}", score=4.0, evidence={}) for i in range(9)]
        response = client.post("/api/content/gate", json={"attributes": [a.dict() for a in attributes]})
        assert response.status_code == 200
        data = response.json()
        assert data["pass_gate"] is False
        assert data["total_score"] == 36.0
        assert len(data["reasons"]) > 0

    def test_analyze_endpoint(self):
        mock_attributes = [AttributeScore(name=f"Attr{i}", score=7.0, evidence={}) for i in range(9)]
        with patch('src.main.extractor.extract_all_attributes') as mock_extract:
            mock_extract.return_value = (mock_attributes, {})
            response = client.post("/api/content/analyze", json={"file_path": __file__})
        assert response.status_code == 200
        data = response.json()
        assert "audit_id" in data
        assert data["total_score"] == 63.0
        assert len(data["attributes"]) == 9


