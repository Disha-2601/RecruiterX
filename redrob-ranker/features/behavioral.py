import numpy as np
from datetime import datetime

def days_between(date_str1: str, date_str2: str) -> float:
    try:
        d1 = datetime.strptime(date_str1, "%Y-%m-%d")
        d2 = datetime.strptime(date_str2, "%Y-%m-%d")
        return abs((d1 - d2).days)
    except Exception:
        return 90.0 # default to 90 days (1 active decay time constant) if invalid

def availability_score(signals: dict, reference_date: str = "2026-06-30") -> float:
    if not signals:
        return 0.0
    open_to_work = float(signals.get("open_to_work_flag", False))
    last_active = signals.get("last_active_date", "")
    
    days_since = days_between(last_active, reference_date)
    recency = np.exp(-days_since / 90.0)
    
    return float(0.5 * open_to_work + 0.5 * recency)

def responsiveness_score(signals: dict) -> float:
    if not signals:
        return 0.0
    response_rate = float(signals.get("recruiter_response_rate", 0.0))
    # Handle response rate being null or out of range
    response_rate = max(0.0, min(1.0, response_rate))
    
    avg_response_time = float(signals.get("avg_response_time_hours", 24.0))
    if avg_response_time < 0:
        avg_response_time = 24.0
        
    return float(response_rate / (1.0 + avg_response_time / 24.0))

def reliability_score(signals: dict) -> float:
    if not signals:
        return 0.0
    completion_rate = float(signals.get("interview_completion_rate", 0.0))
    return float(max(0.0, min(1.0, completion_rate)))

def trust_score(signals: dict) -> float:
    if not signals:
        return 0.0
    verified_email = float(signals.get("verified_email", False))
    verified_phone = float(signals.get("verified_phone", False))
    linkedin_connected = float(signals.get("linkedin_connected", False))
    
    return float(np.mean([verified_email, verified_phone, linkedin_connected]))

def mask_sentinel(val: float, default: float = 0.5) -> float:
    if val is None or val == -1 or val == -1.0:
        return default
    return float(val)

def behavioral_score(signals: dict, reference_date: str = "2026-06-30") -> float:
    if not signals:
        return 0.0
        
    avail = availability_score(signals, reference_date)
    resp = responsiveness_score(signals)
    rel = reliability_score(signals)
    tru = trust_score(signals)
    
    # Optional signals (sentinels masked)
    github_raw = signals.get("github_activity_score", -1)
    github_score = mask_sentinel(github_raw, default=50.0) / 100.0 # normalize 0-100 to 0-1
    
    offer_raw = signals.get("offer_acceptance_rate", -1)
    offer_score = mask_sentinel(offer_raw, default=0.5) # already 0-1 range
    
    base_score = 0.35 * avail + 0.35 * resp + 0.20 * rel + 0.10 * tru
    
    # We can slightly adjust by github activity and offer acceptance
    # E.g. 0.9 * base_score + 0.05 * github_score + 0.05 * offer_score
    final_score = 0.9 * base_score + 0.05 * github_score + 0.05 * offer_score
    return float(final_score)
