import json
from datetime import datetime

PROFICIENCY_WEIGHTS = {
    "beginner": 0.25,
    "intermediate": 0.5,
    "advanced": 0.75,
    "expert": 1.0
}

def find_overlapping_roles(career_history: list[dict]) -> bool:
    parsed = []
    for role in career_history:
        start_str = role.get("start_date")
        end_str = role.get("end_date")
        is_current = role.get("is_current", False)
        
        if not start_str:
            continue
        try:
            start = datetime.strptime(start_str, "%Y-%m-%d")
        except Exception:
            continue
            
        if is_current or not end_str:
            # Statically represent current end as max time
            end = datetime.max
        else:
            try:
                end = datetime.strptime(end_str, "%Y-%m-%d")
            except Exception:
                continue
                
        parsed.append((start, end, is_current))
        
    parsed.sort(key=lambda x: x[0])
    
    # Verify overlaps
    for i in range(len(parsed) - 1):
        curr_end = parsed[i][1]
        next_start = parsed[i+1][0]
        curr_is_current = parsed[i][2]
        next_is_current = parsed[i+1][2]
        
        # If current end is after next start, and neither is a current role
        if curr_end > next_start and not (curr_is_current or next_is_current):
            overlap_days = (min(curr_end, parsed[i+1][1]) - next_start).days
            # Ignore minor transition overlaps (<= 15 days)
            if overlap_days > 15:
                return True
    return False

def consistency_penalty(candidate: dict) -> tuple[float, list[str]]:
    """
    Returns (penalty in [0,1], list of human-readable flag strings for reasoning_generator)
    """
    penalty = 0.0
    flags = []
    
    skills = candidate.get("skills", [])
    career_history = candidate.get("career_history", [])
    profile = candidate.get("profile", {})
    redrob_signals = candidate.get("redrob_signals", {})
    
    # Check A: claimed expert proficiency with near-zero duration (<= 2 months)
    for s in skills:
        name = s.get("name", "")
        proficiency = s.get("proficiency", "beginner").lower()
        duration = s.get("duration_months", 0)
        
        if proficiency == "expert" and duration <= 2:
            penalty += 0.3
            flags.append(f"claims expert-level {name} with under 2 months of use")
            
    # Check B: years_of_experience doesn't match summed career_history duration
    yoe = profile.get("years_of_experience", 0.0)
    yoe_months = yoe * 12
    sum_months = sum(role.get("duration_months", 0) for role in career_history)
    
    if abs(yoe_months - sum_months) > 24:
        penalty += 0.3
        flags.append(f"claims {yoe} years experience but career history only sums to {round(sum_months/12, 1)} years")
        
    # Check C: overlapping career_history date ranges
    if find_overlapping_roles(career_history):
        penalty += 0.25
        flags.append("overlapping employment dates that don't align with stated current role")
        
    # Check D: claimed skill vs tested score, large mismatch (> 40 points)
    test_scores = redrob_signals.get("skill_assessment_scores", {})
    for skill_name, tested_score in test_scores.items():
        if tested_score == -1 or tested_score is None:
            continue
            
        claimed = next((s for s in skills if s.get("name", "").lower() == skill_name.lower()), None)
        if claimed:
            claimed_prof = claimed.get("proficiency", "beginner").lower()
            claimed_score = PROFICIENCY_WEIGHTS.get(claimed_prof, 0.25) * 100.0
            
            if claimed_score - tested_score > 40.0:
                penalty += 0.15
                flags.append(f"claims {claimed_prof} {skill_name} but tested score is only {tested_score}/100")
                
    # Check E: Uniformly expert skills (keyword-stuffer signal, if >= 8 skills and all are expert)
    if len(skills) >= 8 and all(s.get("proficiency", "beginner").lower() == "expert" for s in skills):
        penalty += 0.2
        flags.append("suspiciously claims expert proficiency in all listed skills")
        
    return float(min(penalty, 1.0)), flags
