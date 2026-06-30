import hashlib

TEMPLATES = [
    "{title} with {yoe} yrs; strong in {s1} and {s2}; {concern}",
    "{title} offering {yoe} years experience; key strengths include {s1} and {s2}; {concern}",
    "Experienced {title} ({yoe} yrs); demonstrates strong {s1} and {s2} alignment; {concern}",
    "{title} showing {yoe} yrs of history; matches well on {s1} and {s2}; {concern}",
    "{title} with {yoe} yrs experience; notable fit on {s1} and {s2}; {concern}",
]

def hash_candidate(candidate_id: str) -> int:
    # Use MD5 or simple stable hash (since python's hash() is randomized per process)
    # We want reproducibility across runs
    hasher = hashlib.md5(candidate_id.encode('utf-8'))
    return int(hasher.hexdigest(), 16)

def get_top_skills(candidate_skills: list[dict], jd_skill_weights: dict[str, float]) -> list[str]:
    # Get candidate skills matching JD, sorted by proficiency weight
    prof_weights = {"expert": 4, "advanced": 3, "intermediate": 2, "beginner": 1}
    matched = []
    
    # Normalize JD skills
    from .skill_match import find_matched_jd_skill
    
    for s in candidate_skills:
        name = s.get("name", "")
        prof = s.get("proficiency", "beginner").lower()
        if find_matched_jd_skill(name, jd_skill_weights):
            matched.append((name, prof_weights.get(prof, 1)))
            
    # Sort by proficiency descending
    matched.sort(key=lambda x: -x[1])
    return [m[0] for m in matched[:2]]

def generate_reasoning(candidate: dict, feature_breakdown: dict, flags: list[str], jd_skill_weights: dict[str, float]) -> str:
    profile = candidate.get("profile", {})
    title = profile.get("current_title", "Engineer").strip()
    if not title:
        title = "Candidate"
        
    yoe = profile.get("years_of_experience", 0.0)
    
    # Get top 2 matching skills
    skills = get_top_skills(candidate.get("skills", []), jd_skill_weights)
    s1 = skills[0] if len(skills) > 0 else "core skills"
    s2 = skills[1] if len(skills) > 1 else "domain knowledge"
    
    # Determine concern or positive closing phrase
    redrob_signals = candidate.get("redrob_signals", {})
    concern_phrase = ""
    
    if flags:
        concern_phrase = f"note: {flags[0]}"
    else:
        # Check minor concerns
        notice_days = redrob_signals.get("notice_period_days", 0)
        resp_rate = redrob_signals.get("recruiter_response_rate", 0.0)
        pref_mode = redrob_signals.get("preferred_work_mode", "")
        
        if notice_days > 90:
            concern_phrase = f"notice period is long ({notice_days} days)"
        elif resp_rate < 0.2 and resp_rate >= 0.0:
            concern_phrase = f"low response rate to recruiters ({int(resp_rate * 100)}%)"
        elif pref_mode == "remote":
            concern_phrase = "prefers remote work"
        else:
            # Positive closure if no concerns
            if resp_rate >= 0.7:
                concern_phrase = f"highly responsive to recruiters ({int(resp_rate * 100)}%)"
            elif redrob_signals.get("open_to_work_flag", False):
                concern_phrase = "marked as actively looking"
            else:
                concern_phrase = "profile is complete and verified"
                
    # Deterministic template selection
    candidate_id = candidate.get("candidate_id", "CAND_0000000")
    template_idx = hash_candidate(candidate_id) % len(TEMPLATES)
    template = TEMPLATES[template_idx]
    
    # Format and clean double semicolons or empty spots
    reasoning = template.format(
        title=title,
        yoe=yoe,
        s1=s1,
        s2=s2,
        concern=concern_phrase
    )
    
    # Minor formatting cleanup
    reasoning = reasoning.replace("  ", " ").replace("; ;", ";").strip()
    return reasoning
