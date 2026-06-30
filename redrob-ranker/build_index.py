import os
import sys
import json
import time
import numpy as np
import pandas as pd
import orjson
from sentence_transformers import SentenceTransformer
from datetime import datetime

def parse_date(date_str):
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str, "%Y-%m-%d")
    except Exception:
        return None

def find_overlapping_roles(career_history):
    parsed = []
    for role in career_history:
        start_str = role.get("start_date")
        end_str = role.get("end_date")
        is_current = role.get("is_current", False)
        
        if not start_str:
            continue
        start = parse_date(start_str)
        if not start:
            continue
            
        if is_current or not end_str:
            end = datetime.max
        else:
            end = parse_date(end_str)
            if not end:
                continue
                
        parsed.append((start, end, is_current))
        
    parsed.sort(key=lambda x: x[0])
    
    for i in range(len(parsed) - 1):
        curr_end = parsed[i][1]
        next_start = parsed[i+1][0]
        curr_is_current = parsed[i][2]
        next_is_current = parsed[i+1][2]
        
        if curr_end > next_start and not (curr_is_current or next_is_current):
            overlap_days = (min(curr_end, parsed[i+1][1]) - next_start).days
            if overlap_days > 15:
                return True
    return False

def precompute_consistency_gate(candidate):
    skills = candidate.get("skills", [])
    career_history = candidate.get("career_history", [])
    profile = candidate.get("profile", {})
    redrob_signals = candidate.get("redrob_signals", {})
    
    # 1. Expert with low duration
    has_expert_low_duration = False
    for s in skills:
        if s.get("proficiency", "").lower() == "expert" and s.get("duration_months", 0) <= 2:
            has_expert_low_duration = True
            break
            
    # 2. YoE mismatch
    yoe = profile.get("years_of_experience", 0.0)
    yoe_months = yoe * 12
    sum_months = sum(role.get("duration_months", 0) for role in career_history)
    has_yoe_mismatch = abs(yoe_months - sum_months) > 24
    
    # 3. Overlap
    has_overlap = find_overlapping_roles(career_history)
    
    # 4. Assessment mismatch
    has_assessment_mismatch = False
    test_scores = redrob_signals.get("skill_assessment_scores", {})
    prof_weights = {"beginner": 25.0, "intermediate": 50.0, "advanced": 75.0, "expert": 100.0}
    for skill_name, score in test_scores.items():
        if score == -1 or score is None:
            continue
        claimed = next((s for s in skills if s.get("name", "").lower() == skill_name.lower()), None)
        if claimed:
            claimed_prof = claimed.get("proficiency", "beginner").lower()
            claimed_score = prof_weights.get(claimed_prof, 25.0)
            if claimed_score - score > 40.0:
                has_assessment_mismatch = True
                break
                
    # 5. Suspicious uniformity
    has_suspicious_uniformity = len(skills) >= 8 and all(s.get("proficiency", "beginner").lower() == "expert" for s in skills)
    
    return {
        "has_expert_low_duration": has_expert_low_duration,
        "has_yoe_mismatch": has_yoe_mismatch,
        "has_overlap": has_overlap,
        "has_assessment_mismatch": has_assessment_mismatch,
        "has_suspicious_uniformity": has_suspicious_uniformity,
        "career_duration_total_months": sum_months
    }

def main():
    if len(sys.argv) < 2:
        print("Usage: python build_index.py <path_to_candidates.jsonl>")
        sys.exit(1)
        
    candidates_path = sys.argv[1]
    if not os.path.exists(candidates_path):
        print(f"Error: {candidates_path} does not exist.")
        sys.exit(1)
        
    start_time = time.time()
    
    # Load model
    print("Loading SentenceTransformer model...")
    model = SentenceTransformer("all-MiniLM-L6-v2")
    
    candidate_ids = []
    skills_texts = []
    career_texts_meta = [] # list of lists of (text, duration)
    flat_rows = []
    
    print("Stream-parsing candidates...")
    with open(candidates_path, "r", encoding="utf-8") as f:
        for idx, line in enumerate(f):
            if not line.strip():
                continue
            cand = orjson.loads(line)
            cid = cand["candidate_id"]
            candidate_ids.append(cid)
            
            profile = cand.get("profile", {})
            signals = cand.get("redrob_signals", {})
            skills = cand.get("skills", [])
            career = cand.get("career_history", [])
            education = cand.get("education", [])
            
            # Skills string
            skill_names = [s.get("name", "") for s in skills]
            skills_texts.append(", ".join(skill_names))
            
            # Career strings
            roles = []
            for role in career:
                t = role.get("title", "")
                d = role.get("description", "")
                dur = max(0, role.get("duration_months", 0))
                text = f"{t} - {d}".strip()
                if text:
                    roles.append((text, dur))
            career_texts_meta.append(roles)
            
            # Precompute consistency gate flags
            gate_data = precompute_consistency_gate(cand)
            
            # Education best tier
            tier_ranks = {"tier_1": 1, "tier_2": 2, "tier_3": 3, "tier_4": 4, "unknown": 5}
            best_tier_rank = 5
            best_tier = "unknown"
            for edu in education:
                tier = edu.get("tier", "unknown").lower()
                rank = tier_ranks.get(tier, 5)
                if rank < best_tier_rank:
                    best_tier_rank = rank
                    best_tier = tier
                    
            edu_fields = [e.get("field_of_study", "") for e in education if e.get("field_of_study")]
            edu_degrees = [e.get("degree", "") for e in education if e.get("degree")]
            
            # Extract flat features
            row = {
                "candidate_id": cid,
                "years_of_experience": profile.get("years_of_experience", 0.0),
                "current_title": profile.get("current_title", ""),
                "current_company": profile.get("current_company", ""),
                "current_company_size": profile.get("current_company_size", ""),
                "current_industry": profile.get("current_industry", ""),
                "headline": profile.get("headline", ""),
                "summary": profile.get("summary", ""),
                "location": profile.get("location", ""),
                "country": profile.get("country", ""),
                "anonymized_name": profile.get("anonymized_name", ""),
                
                # Precomputed gate flags
                "has_expert_low_duration": gate_data["has_expert_low_duration"],
                "has_yoe_mismatch": gate_data["has_yoe_mismatch"],
                "has_overlap": gate_data["has_overlap"],
                "has_assessment_mismatch": gate_data["has_assessment_mismatch"],
                "has_suspicious_uniformity": gate_data["has_suspicious_uniformity"],
                "career_duration_total_months": gate_data["career_duration_total_months"],
                
                # Education
                "education_tier_best": best_tier,
                "education_fields_joined": ", ".join(edu_fields),
                "education_degrees_joined": ", ".join(edu_degrees),
                
                # Raw fields JSON-serialized
                "skills_json": orjson.dumps(skills).decode('utf-8'),
                "career_history_json": orjson.dumps(career).decode('utf-8'),
                
                # Signals
                "profile_completeness_score": signals.get("profile_completeness_score", 0.0),
                "signup_date": signals.get("signup_date", ""),
                "last_active_date": signals.get("last_active_date", ""),
                "open_to_work_flag": signals.get("open_to_work_flag", False),
                "profile_views_received_30d": signals.get("profile_views_received_30d", 0),
                "applications_submitted_30d": signals.get("applications_submitted_30d", 0),
                "recruiter_response_rate": signals.get("recruiter_response_rate", 0.0),
                "avg_response_time_hours": signals.get("avg_response_time_hours", 24.0),
                "skill_assessment_scores_json": orjson.dumps(signals.get("skill_assessment_scores", {})).decode('utf-8'),
                "connection_count": signals.get("connection_count", 0),
                "endorsements_received": signals.get("endorsements_received", 0),
                "notice_period_days": signals.get("notice_period_days", 0),
                "expected_salary_range_inr_lpa_min": signals.get("expected_salary_range_inr_lpa", {}).get("min", 0.0),
                "expected_salary_range_inr_lpa_max": signals.get("expected_salary_range_inr_lpa", {}).get("max", 0.0),
                "preferred_work_mode": signals.get("preferred_work_mode", ""),
                "willing_to_relocate": signals.get("willing_to_relocate", False),
                "github_activity_score": signals.get("github_activity_score", -1.0),
                "search_appearance_30d": signals.get("search_appearance_30d", 0),
                "saved_by_recruiters_30d": signals.get("saved_by_recruiters_30d", 0),
                "interview_completion_rate": signals.get("interview_completion_rate", 0.0),
                "offer_acceptance_rate": signals.get("offer_acceptance_rate", -1.0),
                "verified_email": signals.get("verified_email", False),
                "verified_phone": signals.get("verified_phone", False),
                "linkedin_connected": signals.get("linkedin_connected", False),
            }
            flat_rows.append(row)
            
            if (idx + 1) % 20000 == 0:
                print(f"Parsed {idx + 1} candidates...")
                
    df = pd.DataFrame(flat_rows)
    print(f"Candidate feature table shape: {df.shape}")
    
    # Save parquet
    os.makedirs("cache", exist_ok=True)
    parquet_path = os.path.join("cache", "candidate_features.parquet")
    df.to_parquet(parquet_path, index=False)
    print(f"Saved feature table to {parquet_path}")
    
    # Save ids
    np.save(os.path.join("cache", "candidate_ids.npy"), np.array(candidate_ids))
    
    # Start multi-process pool on available CPU cores
    print("Starting multi-process pool...")
    pool = model.start_multi_process_pool()
    
    # 2. Embed skills
    print("Embedding skills (multi-process)...")
    skill_embeddings = model.encode_multi_process(skills_texts, pool, batch_size=512)
    np.save(os.path.join("cache", "skill_embeddings.npy"), skill_embeddings)
    print("Saved skill embeddings.")
    
    # 3. Embed careers (duration-weighted average)
    print("Embedding career history...")
    flat_career_texts = []
    career_mappings = []
    flat_idx = 0
    for cand_idx, roles in enumerate(career_texts_meta):
        mappings = []
        for text, dur in roles:
            flat_career_texts.append(text)
            mappings.append((flat_idx, dur))
            flat_idx += 1
        career_mappings.append(mappings)
        
    print(f"Total individual roles to embed: {len(flat_career_texts)}")
    if len(flat_career_texts) > 0:
        flat_career_embeddings = model.encode_multi_process(flat_career_texts, pool, batch_size=512)
    else:
        flat_career_embeddings = np.array([])
        
    # Stop multi-process pool
    model.stop_multi_process_pool(pool)

        
    career_embeddings = np.zeros((len(candidate_ids), 384), dtype=np.float32)
    for cand_idx, mappings in enumerate(career_mappings):
        if not mappings:
            continue
        total_dur = sum(dur for _, dur in mappings)
        if total_dur == 0:
            weights = [1.0] * len(mappings)
        else:
            weights = [dur for _, dur in mappings]
            
        weighted_sum = np.zeros(384, dtype=np.float32)
        for idx, (f_idx, _) in enumerate(mappings):
            weighted_sum += flat_career_embeddings[f_idx] * weights[idx]
            
        career_embeddings[cand_idx] = weighted_sum / sum(weights)
        
    np.save(os.path.join("cache", "career_embeddings.npy"), career_embeddings)
    print("Saved career history embeddings.")
    
    # 4. Embed JD if cache/jd_requirements.json exists
    jd_req_path = os.path.join("cache", "jd_requirements.json")
    if os.path.exists(jd_req_path):
        print("Embedding JD requirements...")
        with open(jd_req_path, "r", encoding="utf-8") as f:
            jd_req = json.load(f)
            
        # Concatenate JD required skills
        jd_skills_text = ", ".join(jd_req.get("required_skills", {}).keys())
        jd_skill_emb = model.encode([jd_skills_text], convert_to_numpy=True)[0]
        np.save(os.path.join("cache", "jd_skill_embedding.npy"), jd_skill_emb)
        
        # JD full text
        jd_text = jd_req.get("jd_text_for_embedding", "")
        jd_career_emb = model.encode([jd_text], convert_to_numpy=True)[0]
        np.save(os.path.join("cache", "jd_career_embedding.npy"), jd_career_emb)
        print("Saved JD embeddings.")
        
    end_time = time.time()
    print(f"Indexing completed in {round((end_time - start_time) / 60, 2)} minutes.")

if __name__ == "__main__":
    main()
