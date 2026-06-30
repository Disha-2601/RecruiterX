import numpy as np
from features.skill_match import (
    normalize_skill_name,
    find_matched_jd_skill,
    structured_skill_score,
    assessment_boost,
    skill_match_score
)

def test_normalize_skill_name():
    assert normalize_skill_name("Machine Learning") == "machine learning"
    assert normalize_skill_name("machine-learning") == "machine learning"
    assert normalize_skill_name("  NLP_expert  ") == "nlp expert"
    assert normalize_skill_name("") == ""

def test_find_matched_jd_skill():
    jd_skills = {"python": 1.0, "vector databases": 1.0, "machine learning": 0.8}
    
    assert find_matched_jd_skill("Python", jd_skills) == "python"
    assert find_matched_jd_skill("Vector DBs", jd_skills) == "vector databases"
    assert find_matched_jd_skill("machine-learning", jd_skills) == "machine learning"
    assert find_matched_jd_skill("Java", jd_skills) is None

def test_structured_skill_score():
    jd_skills = {"python": 1.0, "rag": 0.9}
    
    # 1. Candidate with exact matching skills
    candidate_skills = [
        {"name": "Python", "proficiency": "expert", "endorsements": 0, "duration_months": 60},
        {"name": "RAG", "proficiency": "intermediate", "endorsements": 0, "duration_months": 60}
    ]
    # Python: weight 1.0 * prof 1.0 * (0.7 + 0.2 * 1.0 + 0.1 * 0.0) = 0.9
    # RAG: weight 0.9 * prof 0.5 * (0.7 + 0.2 * 1.0 + 0.1 * 0.0) = 0.405
    # sum = 1.305, max = 1.9 -> score = 1.305 / 1.9 = 0.6868
    score = structured_skill_score(candidate_skills, jd_skills)
    assert 0.68 <= score <= 0.69
    
    # 2. Candidate with no matching skills
    candidate_skills_none = [
        {"name": "Java", "proficiency": "expert", "endorsements": 10, "duration_months": 12}
    ]
    assert structured_skill_score(candidate_skills_none, jd_skills) == 0.0

def test_assessment_boost():
    jd_skills = {"python": 1.0, "rag": 0.9}
    
    # Matching assessment scores
    signals_match = {
        "skill_assessment_scores": {
            "Python": 80.0,
            "RAG": 60.0,
            "Java": 100.0  # not in JD
        }
    }
    # average of python (0.8) and rag (0.6) = 0.7
    assert assessment_boost(signals_match, jd_skills) == 0.7
    
    # Sentinel masking
    signals_sentinel = {
        "skill_assessment_scores": {
            "Python": -1.0,
            "RAG": 90.0
        }
    }
    # python masked, average is only rag = 0.9
    assert assessment_boost(signals_sentinel, jd_skills) == 0.9
    
    # No assessments
    assert assessment_boost({}, jd_skills) == 0.5
    assert assessment_boost({"skill_assessment_scores": {}}, jd_skills) == 0.5

def test_skill_match_score():
    jd_skills = {"python": 1.0, "rag": 0.9}
    candidate = {
        "skills": [{"name": "Python", "proficiency": "expert", "endorsements": 0, "duration_months": 60}],
        "redrob_signals": {"skill_assessment_scores": {"Python": 100.0}}
    }
    
    skill_emb = np.ones(384)
    jd_emb = np.ones(384)
    
    score = skill_match_score(candidate, skill_emb, jd_emb, jd_skills)
    assert 0.0 <= score <= 1.0
