"""Unit tests for the adaptive scoring route.

All logic is pure (no AI calls), so tests run without any mocking.
"""
import pytest

from app.api.routes.adaptive import AdaptiveScoreRequest, calculate_score


def make_request(**kwargs) -> AdaptiveScoreRequest:
    defaults = {
        "studentId": "student-1",
        "topic": "Recursion",
        "scorePercent": 75,
        "difficulty": "beginner",
        "currentMasteryScore": 50.0,
        "quizScore": 0.0,
        "hintCount": 0,
        "totalTimeSeconds": 120,
        "questionCount": 10,
    }
    defaults.update(kwargs)
    return AdaptiveScoreRequest(**defaults)


# ── difficulty progression ──────────────────────────────────────────────────


class TestDifficultyProgression:
    @pytest.mark.anyio
    async def test_score_above_80_promotes_from_beginner_to_intermediate(self):
        result = await calculate_score(make_request(scorePercent=85, difficulty="beginner"))
        assert result.recommendedDifficulty == "intermediate"

    @pytest.mark.anyio
    async def test_score_above_80_promotes_from_intermediate_to_advanced(self):
        result = await calculate_score(make_request(scorePercent=85, difficulty="intermediate"))
        assert result.recommendedDifficulty == "advanced"

    @pytest.mark.anyio
    async def test_score_above_80_stays_at_advanced(self):
        result = await calculate_score(make_request(scorePercent=85, difficulty="advanced"))
        assert result.recommendedDifficulty == "advanced"

    @pytest.mark.anyio
    async def test_score_between_50_and_79_keeps_same_difficulty(self):
        result = await calculate_score(make_request(scorePercent=65, difficulty="intermediate"))
        assert result.recommendedDifficulty == "intermediate"

    @pytest.mark.anyio
    async def test_score_below_50_demotes_from_advanced_to_intermediate(self):
        result = await calculate_score(make_request(scorePercent=40, difficulty="advanced"))
        assert result.recommendedDifficulty == "intermediate"

    @pytest.mark.anyio
    async def test_score_below_50_demotes_from_intermediate_to_beginner(self):
        result = await calculate_score(make_request(scorePercent=40, difficulty="intermediate"))
        assert result.recommendedDifficulty == "beginner"

    @pytest.mark.anyio
    async def test_score_below_50_stays_at_beginner(self):
        result = await calculate_score(make_request(scorePercent=40, difficulty="beginner"))
        assert result.recommendedDifficulty == "beginner"


# ── mastery signal ──────────────────────────────────────────────────────────


class TestMasterySignal:
    @pytest.mark.anyio
    async def test_score_90_plus_is_mastered(self):
        result = await calculate_score(make_request(scorePercent=95))
        assert result.masterySignal == "mastered"

    @pytest.mark.anyio
    async def test_score_80_to_89_is_improving(self):
        result = await calculate_score(make_request(scorePercent=82))
        assert result.masterySignal == "improving"

    @pytest.mark.anyio
    async def test_score_50_to_79_is_improving(self):
        result = await calculate_score(make_request(scorePercent=60))
        assert result.masterySignal == "improving"

    @pytest.mark.anyio
    async def test_score_below_50_is_struggling(self):
        result = await calculate_score(make_request(scorePercent=30))
        assert result.masterySignal == "struggling"


# ── new mastery score ───────────────────────────────────────────────────────


class TestNewMasteryScore:
    @pytest.mark.anyio
    async def test_mastery_score_is_weighted_average_of_current_and_quiz(self):
        result = await calculate_score(
            make_request(scorePercent=100, currentMasteryScore=0.0)
        )
        # 0 * 0.6 + 100 * 0.4 = 40
        assert result.newMasteryScore == pytest.approx(40.0, abs=0.1)

    @pytest.mark.anyio
    async def test_mastery_score_is_capped_at_100(self):
        result = await calculate_score(
            make_request(scorePercent=100, currentMasteryScore=100.0)
        )
        assert result.newMasteryScore <= 100.0

    @pytest.mark.anyio
    async def test_uses_scorePercent_when_provided(self):
        result = await calculate_score(
            make_request(scorePercent=80, quizScore=0.5, currentMasteryScore=0.0)
        )
        # scorePercent takes precedence: 0*0.6 + 80*0.4 = 32
        assert result.newMasteryScore == pytest.approx(32.0, abs=0.1)


# ── mastery level label ─────────────────────────────────────────────────────


class TestMasteryLevel:
    @pytest.mark.anyio
    async def test_mastery_level_novice_for_low_scores(self):
        result = await calculate_score(
            make_request(scorePercent=0, currentMasteryScore=0.0)
        )
        assert result.masteryLevel == "novice"

    @pytest.mark.anyio
    async def test_mastery_level_mastered_for_high_mastery(self):
        result = await calculate_score(
            make_request(scorePercent=100, currentMasteryScore=100.0)
        )
        assert result.masteryLevel == "mastered"
