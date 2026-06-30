from features.reasoning_generator import hash_candidate, get_top_skills, generate_reasoning

def test_hash_candidate():
    h1 = hash_candidate("CAND_0000001")
    h2 = hash_candidate("CAND_0000001")
    h3 = hash_candidate("CAND_0000002")
    
    assert h1 == h2
    assert h1 != h3

def test_get_top_skills():
    jd_skills = {"python": 1.0, "vector databases": 1.0, "rag": 0.8}
    candidate_skills = [
        {"name": "Python", "proficiency": "expert"},
        {"name": "Java", "proficiency": "expert"}, # not in JD
        {"name": "Vector Databases", "proficiency": "intermediate"}
    ]
    
    top = get_top_skills(candidate_skills, jd_skills)
    assert len(top) == 2
    assert top[0] == "Python"
    assert top[1] == "Vector Databases"

def test_generate_reasoning_clean():
    jd_skills = {"python": 1.0, "rag": 0.9}
    candidate = {
        "candidate_id": "CAND_0000001",
        "profile": {
            "current_title": "AI Engineer",
            "years_of_experience": 6.5
        },
        "skills": [
            {"name": "Python", "proficiency": "expert"}
        ],
        "redrob_signals": {
            "recruiter_response_rate": 0.85,
            "notice_period_days": 15
        }
    }
    breakdown = {"skill_match": 0.9, "experience_fit": 0.8, "behavioral": 0.8}
    
    reasoning = generate_reasoning(candidate, breakdown, [], jd_skills)
    assert "AI Engineer" in reasoning
    assert "6.5" in reasoning
    assert "Python" in reasoning
    assert "highly responsive to recruiters" in reasoning

def test_generate_reasoning_concern():
    jd_skills = {"python": 1.0}
    candidate = {
        "candidate_id": "CAND_0000002",
        "profile": {
            "current_title": "ML Engineer",
            "years_of_experience": 5.0
        },
        "skills": [
            {"name": "Python", "proficiency": "expert"}
        ],
        "redrob_signals": {
            "notice_period_days": 45
        }
    }
    breakdown = {"skill_match": 0.8, "experience_fit": 0.7, "behavioral": 0.5}
    flags = ["claims expert proficiency with low duration"]
    
    reasoning = generate_reasoning(candidate, breakdown, flags, jd_skills)
    assert "ML Engineer" in reasoning
    assert "note: claims expert proficiency with low duration" in reasoning
