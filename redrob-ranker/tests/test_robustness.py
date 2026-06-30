import numpy as np
import pytest
from features.skill_match import skill_match_score, find_matched_jd_skill
from features.experience_fit import compute_experience_fit
from features.behavioral import behavioral_score, mask_sentinel
from features.consistency_gate import consistency_penalty

def test_robustness_empty_skills():
    jd_skills = {"python": 1.0, "rag": 0.9}
    candidate = {
        "skills": [],
        "redrob_signals": {"skill_assessment_scores": {}}
    }
    skill_emb = np.zeros(384)
    jd_emb = np.zeros(384)
    
    # Should not crash, and should return a valid low score
    score = skill_match_score(candidate, skill_emb, jd_emb, jd_skills)
    assert isinstance(score, float)
    assert 0.0 <= score <= 0.5 # should be low since structured is 0

def test_robustness_empty_career():
    career_emb = np.zeros(384)
    jd_emb = np.zeros(384)
    
    # Should not crash or divide by zero
    score = compute_experience_fit(0.0, 5.0, 9.0, career_emb, jd_emb)
    assert isinstance(score, float)
    assert 0.0 <= score <= 1.0

def test_robustness_missing_assessment_scores():
    jd_skills = {"python": 1.0}
    candidate = {
        "skills": [{"name": "Python", "proficiency": "expert"}],
        "redrob_signals": {} # Missing skill_assessment_scores
    }
    skill_emb = np.zeros(384)
    jd_emb = np.zeros(384)
    
    score = skill_match_score(candidate, skill_emb, jd_emb, jd_skills)
    assert isinstance(score, float)
    assert 0.0 <= score <= 1.0

def test_robustness_null_end_date_non_current():
    # Inconsistency, but should not crash overlapping check
    candidate = {
        "skills": [],
        "career_history": [
            {"start_date": "2020-01-01", "end_date": None, "is_current": False, "duration_months": 12},
            {"start_date": "2021-02-01", "end_date": "2022-01-01", "is_current": False, "duration_months": 11}
        ]
    }
    # This should be flagged as overlapping since the first one has end_date: None (treated as datetime.max)
    penalty, flags = consistency_penalty(candidate)
    assert penalty >= 0.25
    assert any("overlapping" in f for f in flags)

def test_robustness_sentinel_masking():
    # Masking of -1 values to default neutral values
    assert mask_sentinel(-1.0, default=0.5) == 0.5
    assert mask_sentinel(-1, default=0.5) == 0.5
    assert mask_sentinel(0.75, default=0.5) == 0.75
    assert mask_sentinel(None, default=0.5) == 0.5
    
    # Checking inside behavioral_score
    signals = {
        "github_activity_score": -1,
        "offer_acceptance_rate": -1,
        "last_active_date": "2026-06-01",
        "open_to_work_flag": True,
        "recruiter_response_rate": 0.8,
        "avg_response_time_hours": 2.0,
        "interview_completion_rate": 0.9,
        "verified_email": True,
        "verified_phone": True,
        "linkedin_connected": True
    }
    score = behavioral_score(signals)
    assert isinstance(score, float)
    assert 0.0 <= score <= 1.0

def test_robustness_skill_name_variation():
    jd_skills = {"Machine Learning": 1.0, "NLP": 0.9}
    
    # Check normalization and fuzzy matching on common abbreviations/variants
    assert find_matched_jd_skill("machine-learning", jd_skills) == "Machine Learning"
    assert find_matched_jd_skill("ML", jd_skills) == "Machine Learning"
    assert find_matched_jd_skill("Natural Language Processing", jd_skills) == "NLP"
    assert find_matched_jd_skill("nlp", jd_skills) == "NLP"

def test_robustness_suspicious_uniformity():
    # Check E in consistency gate: >= 8 skills and all are expert
    candidate = {
        "skills": [{"name": f"Skill{i}", "proficiency": "expert"} for i in range(8)],
        "career_history": [{"duration_months": 12}]
    }
    penalty, flags = consistency_penalty(candidate)
    assert penalty >= 0.2
    assert any("expert" in f for f in flags)
