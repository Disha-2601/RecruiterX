from features.consistency_gate import find_overlapping_roles, consistency_penalty

def test_find_overlapping_roles():
    # 1. No overlaps
    history_clean = [
        {"start_date": "2020-01-01", "end_date": "2021-01-01", "is_current": False},
        {"start_date": "2021-02-01", "end_date": "2022-01-01", "is_current": False}
    ]
    assert not find_overlapping_roles(history_clean)
    
    # 2. Overlap between non-current roles
    history_overlap = [
        {"start_date": "2020-01-01", "end_date": "2021-03-01", "is_current": False},
        {"start_date": "2021-02-01", "end_date": "2022-01-01", "is_current": False}  # Overlaps by ~30 days
    ]
    assert find_overlapping_roles(history_overlap)

def test_consistency_penalty_clean():
    candidate = {
        "profile": {"years_of_experience": 2.0},
        "skills": [
            {"name": "Python", "proficiency": "intermediate", "duration_months": 24}
        ],
        "career_history": [
            {"start_date": "2020-01-01", "end_date": "2022-01-01", "duration_months": 24, "is_current": False}
        ],
        "redrob_signals": {
            "skill_assessment_scores": {"Python": 60.0}
        }
    }
    penalty, flags = consistency_penalty(candidate)
    assert penalty == 0.0
    assert len(flags) == 0

def test_consistency_penalty_expert_low_dur():
    candidate = {
        "profile": {"years_of_experience": 1.0},
        "skills": [
            {"name": "Python", "proficiency": "expert", "duration_months": 1}  # Expert with 1 month!
        ],
        "career_history": [
            {"start_date": "2021-01-01", "end_date": "2022-01-01", "duration_months": 12, "is_current": False}
        ]
    }
    penalty, flags = consistency_penalty(candidate)
    assert penalty == 0.3
    assert "expert-level Python with under 2 months" in flags[0]

def test_consistency_penalty_yoe_mismatch():
    candidate = {
        "profile": {"years_of_experience": 5.0},  # Stated YoE = 5 years = 60 months
        "skills": [],
        "career_history": [
            {"duration_months": 12}  # Stated history sum = 12 months (mismatch of 48 months!)
        ]
    }
    penalty, flags = consistency_penalty(candidate)
    assert penalty == 0.3
    assert "career history only sums to 1.0 years" in flags[0]

def test_consistency_penalty_skills_mismatch():
    candidate = {
        "profile": {"years_of_experience": 1.0},
        "skills": [
            {"name": "Python", "proficiency": "expert", "duration_months": 12}  # Claimed Expert (100)
        ],
        "career_history": [
            {"duration_months": 12}
        ],
        "redrob_signals": {
            "skill_assessment_scores": {
                "Python": 45.0  # Tested score is 45. Mismatch = 100 - 45 = 55 > 40!
            }
        }
    }
    penalty, flags = consistency_penalty(candidate)
    assert penalty == 0.15
    assert "claims expert Python but tested score is only 45.0/100" in flags[0]

def test_consistency_penalty_cap():
    candidate = {
        "profile": {"years_of_experience": 10.0},
        "skills": [
            {"name": "Python", "proficiency": "expert", "duration_months": 1}  # Expert low duration (+0.3)
        ],
        "career_history": [
            {"duration_months": 12}  # YoE mismatch (+0.3)
        ]
    }
    # Total penalty would be 0.6.
    penalty, _ = consistency_penalty(candidate)
    assert penalty == 0.6
