import os
import sys
import json
import time
import numpy as np
import pandas as pd
import orjson
from features.skill_match import structured_skill_score, assessment_boost
from features.consistency_gate import consistency_penalty
from features.reasoning_generator import generate_reasoning

def parse_args():
    # Parse CLI arguments manually to support the exact format required
    args = {"candidates": "candidates.jsonl", "jd": "job_description.md", "out": "submission.csv"}
    i = 1
    while i < len(sys.argv):
        arg = sys.argv[i]
        if arg == "--candidates" and i + 1 < len(sys.argv):
            args["candidates"] = sys.argv[i+1]
            i += 2
        elif arg == "--jd" and i + 1 < len(sys.argv):
            args["jd"] = sys.argv[i+1]
            i += 2
        elif arg == "--out" and i + 1 < len(sys.argv):
            args["out"] = sys.argv[i+1]
            i += 2
        else:
            i += 1
    return args

def main():
    args = parse_args()
    
    start_time = time.time()
    
    # 1. Load cached files
    print("Loading precomputed artifacts...")
    candidate_ids = np.load(os.path.join("cache", "candidate_ids.npy"), allow_pickle=True)
    skill_embeddings = np.load(os.path.join("cache", "skill_embeddings.npy"))
    career_embeddings = np.load(os.path.join("cache", "career_embeddings.npy"))
    jd_skill_embedding = np.load(os.path.join("cache", "jd_skill_embedding.npy"))
    jd_career_embedding = np.load(os.path.join("cache", "jd_career_embedding.npy"))
    
    # Load candidate features parquet
    df = pd.read_parquet(os.path.join("cache", "candidate_features.parquet"))
    
    # Load JD requirements json
    with open(os.path.join("cache", "jd_requirements.json"), "r", encoding="utf-8") as f:
        jd_req = json.load(f)
        
    jd_skill_weights = jd_req.get("required_skills", {})
    min_yoe = jd_req.get("min_years_experience", 5.0)
    max_yoe = jd_req.get("max_years_experience", 9.0)
    preferred_locs = jd_req.get("preferred_locations", [])
    
    print("Computing vectorized features...")
    
    # 2. Skill Match Embedding Sim
    s_norms = np.linalg.norm(skill_embeddings, axis=1)
    jd_s_norm = np.linalg.norm(jd_skill_embedding)
    cos_sim_raw = np.dot(skill_embeddings, jd_skill_embedding) / (s_norms * jd_s_norm + 1e-8)
    cos_sim = np.clip((cos_sim_raw + 1.0) / 2.0, 0.0, 1.0) # normalize to [0,1]
    
    # 3. Experience Trajectory Sim
    c_norms = np.linalg.norm(career_embeddings, axis=1)
    jd_c_norm = np.linalg.norm(jd_career_embedding)
    traj_sim_raw = np.dot(career_embeddings, jd_career_embedding) / (c_norms * jd_c_norm + 1e-8)
    traj_sim = np.clip((traj_sim_raw + 1.0) / 2.0, 0.0, 1.0)
    
    # 4. YoE score
    yoe = df["years_of_experience"].values
    yoe_score = np.zeros_like(yoe)
    mask_in = (yoe >= min_yoe) & (yoe <= max_yoe)
    yoe_score[mask_in] = 1.0
    mask_under = yoe < min_yoe
    yoe_score[mask_under] = np.maximum(0.0, 1.0 - (min_yoe - yoe[mask_under]) * 0.33)
    mask_over = yoe > max_yoe
    yoe_score[mask_over] = np.maximum(0.0, 1.0 - (yoe[mask_over] - max_yoe) * 0.1)
    
    experience_fit = 0.5 * yoe_score + 0.5 * traj_sim
    
    # 5. Behavioral scoring
    open_to_work = df["open_to_work_flag"].astype(float).values
    
    ref_date = "2026-06-30"
    ref_dt = pd.to_datetime(ref_date)
    active_dt = pd.to_datetime(df["last_active_date"], errors="coerce")
    days_since = (ref_dt - active_dt).dt.days.fillna(90.0).values
    recency = np.exp(-days_since / 90.0)
    avail = 0.5 * open_to_work + 0.5 * recency
    
    resp_rate = df["recruiter_response_rate"].clip(0.0, 1.0).values
    avg_resp_time = df["avg_response_time_hours"].values
    avg_resp_time = np.where(avg_resp_time < 0, 24.0, avg_resp_time)
    resp = resp_rate / (1.0 + avg_resp_time / 24.0)
    
    rel = df["interview_completion_rate"].clip(0.0, 1.0).values
    tru = (df["verified_email"].astype(float) + df["verified_phone"].astype(float) + df["linkedin_connected"].astype(float)) / 3.0
    
    github_raw = df["github_activity_score"].values
    github_score = np.where(github_raw == -1, 50.0, github_raw) / 100.0
    
    offer_raw = df["offer_acceptance_rate"].values
    offer_score = np.where(offer_raw == -1, 0.5, offer_raw)
    
    behavioral = 0.9 * (0.35 * avail + 0.35 * resp + 0.20 * rel + 0.10 * tru) + 0.05 * github_score + 0.05 * offer_score
    
    # 6. Education
    edu_tier = df["education_tier_best"].values
    edu_map = {"tier_1": 1.0, "tier_2": 0.75, "tier_3": 0.5, "tier_4": 0.4, "unknown": 0.5}
    education = np.array([edu_map.get(t, 0.5) for t in edu_tier])
    
    # 7. Logistics Fit
    # Location
    loc = df["location"].str.lower().str.strip().values
    loc_score = np.zeros_like(loc, dtype=float)
    preferred_locs_lower = [l.lower().strip() for l in preferred_locs]
    
    for preferred in preferred_locs_lower:
        loc_score = np.where(loc == preferred, 1.0, loc_score)
        
    willing = df["willing_to_relocate"].astype(bool).values
    loc_score = np.where((loc_score == 0.0) & willing, 0.7, loc_score)
    loc_score = np.where((loc_score == 0.0) & (~willing), 0.2, loc_score)
    
    # Work Mode (prefers flexible/hybrid)
    work_mode = df["preferred_work_mode"].str.lower().str.strip().values
    work_mode_score = np.zeros_like(work_mode, dtype=float)
    work_mode_score = np.where((work_mode == "hybrid") | (work_mode == "flexible"), 1.0, work_mode_score)
    work_mode_score = np.where(work_mode == "onsite", 0.8, work_mode_score)
    work_mode_score = np.where(work_mode == "remote", 0.4, work_mode_score)
    
    # Notice Period
    notice = df["notice_period_days"].values
    notice_score = np.ones_like(notice, dtype=float)
    notice_score = np.where(notice > 30, 0.7, notice_score)
    notice_score = np.where(notice > 60, 0.4, notice_score)
    notice_score = np.where(notice > 90, 0.1, notice_score)
    
    logistics_fit = 0.4 * loc_score + 0.3 * work_mode_score + 0.3 * notice_score
    
    # 8. Consistency Gate Penalty
    penalty = (0.3 * df["has_expert_low_duration"].astype(float) +
               0.3 * df["has_yoe_mismatch"].astype(float) +
               0.25 * df["has_overlap"].astype(float) +
               0.15 * df["has_assessment_mismatch"].astype(float) +
               0.2 * df["has_suspicious_uniformity"].astype(float)).values
    penalty = np.minimum(penalty, 1.0)
    
    # 9. Structured skill and assessment scores (needs skills parsing)
    # Run structured skill scoring over candidates
    print("Computing structured skill scores...")
    skills_json_list = df["skills_json"].values
    signals_json_list = df["skill_assessment_scores_json"].values
    
    structured_scores = []
    tested_scores = []
    
    for idx in range(len(df)):
        candidate_skills = orjson.loads(skills_json_list[idx])
        struct_s = structured_skill_score(candidate_skills, jd_skill_weights)
        structured_scores.append(struct_s)
        
        redrob_signals = {"skill_assessment_scores": orjson.loads(signals_json_list[idx])}
        test_s = assessment_boost(redrob_signals, jd_skill_weights)
        tested_scores.append(test_s)
        
    structured_scores = np.array(structured_scores)
    tested_scores = np.array(tested_scores)
    
    skill_match = 0.5 * structured_scores + 0.2 * tested_scores + 0.3 * cos_sim
    
    # 10. Composite raw score
    raw_score = 0.40 * skill_match + 0.25 * experience_fit + 0.20 * behavioral + 0.08 * education + 0.07 * logistics_fit
    
    # 11. Multiplicative consistency gate
    final_score = raw_score * (1.0 - penalty)
    
    df["score"] = np.round(final_score, 4)
    df["skill_match"] = skill_match
    df["experience_fit"] = experience_fit
    df["behavioral"] = behavioral
    df["education"] = education
    df["logistics_fit"] = logistics_fit
    df["consistency_penalty"] = penalty
    
    # 12. Sort and select top 100
    # Tiebreak by candidate_id ascending
    df_sorted = df.sort_values(by=["score", "candidate_id"], ascending=[False, True]).head(100).copy()
    
    # Assign ranks 1 to 100
    df_sorted["rank"] = range(1, 101)
    
    # 13. Generate reasoning for top 100
    print("Generating reasoning for top 100 candidates...")
    reasoning_list = []
    for idx, row in df_sorted.iterrows():
        cand_dict = {
            "candidate_id": row["candidate_id"],
            "profile": {
                "current_title": row["current_title"],
                "years_of_experience": row["years_of_experience"],
            },
            "skills": orjson.loads(row["skills_json"]),
            "redrob_signals": {
                "notice_period_days": row["notice_period_days"],
                "recruiter_response_rate": row["recruiter_response_rate"],
                "preferred_work_mode": row["preferred_work_mode"],
                "open_to_work_flag": row["open_to_work_flag"],
            }
        }
        
        # Collect triggered flags for consistency gate
        flags = []
        if row["has_expert_low_duration"]:
            flags.append("claims expert proficiency with low duration")
        elif row["has_yoe_mismatch"]:
            flags.append("mismatch between stated experience and career history duration")
        elif row["has_overlap"]:
            flags.append("overlapping employment dates in career history")
        elif row["has_assessment_mismatch"]:
            flags.append("claimed proficiency mismatch with verified test scores")
        elif row["has_suspicious_uniformity"]:
            flags.append("uniform expert proficiency claimed across all skills")
            
        breakdown = {
            "skill_match": row["skill_match"],
            "experience_fit": row["experience_fit"],
            "behavioral": row["behavioral"]
        }
        
        reason = generate_reasoning(cand_dict, breakdown, flags, jd_skill_weights)
        reasoning_list.append(reason)
        
    df_sorted["reasoning"] = reasoning_list
    
    # Make sure scores are formatted properly (non-increasing)
    # Check if there's any score violation
    for i in range(len(df_sorted) - 1):
        if df_sorted.iloc[i]["score"] < df_sorted.iloc[i+1]["score"]:
            print(f"Warning: Score violation at ranks {i+1} and {i+2}")
            
    # Write submission CSV
    submission_df = df_sorted[["candidate_id", "rank", "score", "reasoning"]].copy()
    
    # Format score to 4 decimal places
    submission_df["score"] = submission_df["score"].map(lambda x: f"{x:.4f}")
    
    out_path = args["out"]
    submission_df.to_csv(out_path, index=False, encoding="utf-8")
    
    # Also write JSON for Next.js frontend if workspace structure exists
    frontend_json_dir = os.path.join("..", "src", "data")
    if os.path.exists(os.path.join("..", "src")):
        os.makedirs(frontend_json_dir, exist_ok=True)
        frontend_json_path = os.path.join(frontend_json_dir, "ranked_candidates.json")
        
        json_records = []
        for idx, row in df_sorted.iterrows():
            record = {
                "candidate_id": row["candidate_id"],
                "rank": int(row["rank"]),
                "score": float(row["score"]),
                "reasoning": row["reasoning"],
                "anonymized_name": row["anonymized_name"],
                "years_of_experience": float(row["years_of_experience"]),
                "current_title": row["current_title"],
                "current_company": row["current_company"],
                "location": row["location"],
                "notice_period_days": int(row["notice_period_days"]),
                "preferred_work_mode": row["preferred_work_mode"],
                "skill_match": float(row["skill_match"]),
                "experience_fit": float(row["experience_fit"]),
                "behavioral": float(row["behavioral"]),
                "education": float(row["education"]),
                "logistics_fit": float(row["logistics_fit"]),
                "consistency_penalty": float(row["consistency_penalty"]),
                "has_expert_low_duration": bool(row["has_expert_low_duration"]),
                "has_yoe_mismatch": bool(row["has_yoe_mismatch"]),
                "has_overlap": bool(row["has_overlap"]),
                "has_assessment_mismatch": bool(row["has_assessment_mismatch"]),
                "has_suspicious_uniformity": bool(row["has_suspicious_uniformity"])
            }
            json_records.append(record)
            
        with open(frontend_json_path, "w", encoding="utf-8") as f:
            json.dump(json_records, f, indent=2)
        print(f"Saved frontend JSON to {frontend_json_path}")
        
    end_time = time.time()
    print(f"Ranking completed in {round(end_time - start_time, 2)} seconds.")
    print(f"Saved ranked candidates to {out_path}")

if __name__ == "__main__":
    main()
