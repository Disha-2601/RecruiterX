import re
import numpy as np
from rapidfuzz import fuzz

PROFICIENCY_WEIGHTS = {
    "beginner": 0.25,
    "intermediate": 0.5,
    "advanced": 0.75,
    "expert": 1.0
}

def normalize_skill_name(name: str) -> str:
    if not name:
        return ""
    name = name.lower().strip()
    # Replace multiple spaces, dashes, underscores, dots with single space
    name = re.sub(r"[-_.\s]+", " ", name)
    return name.strip()

SYNONYMS = {
    "vector dbs": "vector databases",
    "vector db": "vector databases",
    "vectordb": "vector databases",
    "vectordbs": "vector databases",
    "ml": "machine learning",
    "nlp": "natural language processing",
    "llm": "large language models",
    "llms": "large language models",
    "rag": "retrieval augmented generation",
    "ltr": "learning to rank"
}

def find_matched_jd_skill(skill_name: str, jd_skill_weights: dict[str, float], threshold: float = 85.0) -> str:
    norm_name = normalize_skill_name(skill_name)
    if not norm_name:
        return None
        
    # Apply synonym resolution
    norm_name = SYNONYMS.get(norm_name, norm_name)
    
    # Check exact normalized match first
    for jd_skill in jd_skill_weights:
        norm_jd = normalize_skill_name(jd_skill)
        norm_jd = SYNONYMS.get(norm_jd, norm_jd)
        if norm_jd == norm_name:
            return jd_skill
            
    # Check fuzzy match
    for jd_skill in jd_skill_weights:
        norm_jd = normalize_skill_name(jd_skill)
        norm_jd = SYNONYMS.get(norm_jd, norm_jd)
        score = fuzz.ratio(norm_jd, norm_name)
        if score >= threshold:
            return jd_skill
            
    return None


def structured_skill_score(candidate_skills: list[dict], jd_skill_weights: dict[str, float]) -> float:
    if not jd_skill_weights:
        return 0.0
        
    max_possible = sum(jd_skill_weights.values())
    if max_possible == 0.0:
        return 0.0
        
    score = 0.0
    matched_jd_skills = set()
    
    for s in candidate_skills:
        name = s.get("name", "")
        proficiency = s.get("proficiency", "beginner").lower()
        endorsements = max(0, s.get("endorsements", 0))
        duration_months = max(0, s.get("duration_months", 0))
        
        jd_skill = find_matched_jd_skill(name, jd_skill_weights)
        if jd_skill and jd_skill not in matched_jd_skills:
            matched_jd_skills.add(jd_skill)
            prof_w = PROFICIENCY_WEIGHTS.get(proficiency, 0.25)
            
            # log scaling for duration and endorsements
            dur_factor = min(np.log1p(duration_months) / np.log1p(60.0), 1.0)
            endorse_factor = min(np.log1p(endorsements) / np.log1p(50.0), 1.0)
            
            modifier = 0.7 + 0.2 * dur_factor + 0.1 * endorse_factor
            score += jd_skill_weights[jd_skill] * prof_w * modifier
            
    return score / max_possible

def assessment_boost(redrob_signals: dict, jd_skill_weights: dict[str, float]) -> float:
    """
    Score the candidate's verified platform tests for required skills.
    Returns 0.5 (neutral) if no required skills have test scores, or average score.
    """
    if not redrob_signals:
        return 0.5
        
    test_scores = redrob_signals.get("skill_assessment_scores", {})
    if not test_scores:
        return 0.5
        
    matched_scores = []
    for skill_name, score in test_scores.items():
        # Mask -1 or invalid scores
        if score == -1 or score is None:
            continue
            
        # Check if it matches a required skill
        jd_skill = find_matched_jd_skill(skill_name, jd_skill_weights)
        if jd_skill:
            # Normalize score from 0-100 to 0-1
            normalized_score = max(0.0, min(100.0, float(score))) / 100.0
            matched_scores.append(normalized_score)
            
    if not matched_scores:
        return 0.5
        
    return float(np.mean(matched_scores))

def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    # Handle dimension check
    a_norm = np.linalg.norm(a)
    b_norm = np.linalg.norm(b)
    if a_norm == 0.0 or b_norm == 0.0:
        return 0.0
    return float(np.dot(a, b) / (a_norm * b_norm))

def skill_match_score(candidate: dict, skill_embedding: np.ndarray, jd_skill_embedding: np.ndarray, jd_skill_weights: dict[str, float]) -> float:
    # 1. Structured score
    structured = structured_skill_score(candidate.get("skills", []), jd_skill_weights)
    
    # 2. Tested score
    tested = assessment_boost(candidate.get("redrob_signals", {}), jd_skill_weights)
    
    # 3. Embedding similarity
    if skill_embedding is not None and jd_skill_embedding is not None:
        emb_sim = cosine_similarity(skill_embedding, jd_skill_embedding)
        # Shift cosine similarity from [-1, 1] to [0, 1]
        emb_sim = max(0.0, min(1.0, (emb_sim + 1.0) / 2.0))
    else:
        emb_sim = 0.5
        
    # Combine: 0.5 * structured + 0.2 * tested + 0.3 * embedding_sim
    final_score = 0.5 * structured + 0.2 * tested + 0.3 * emb_sim
    return float(final_score)
