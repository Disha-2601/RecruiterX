import numpy as np

def yoe_band_score(yoe: float, min_yoe: float, max_yoe: float) -> float:
    # Set default values if None or invalid
    if yoe is None or yoe < 0:
        return 0.0
    if min_yoe is None:
        min_yoe = 5.0
    if max_yoe is None:
        max_yoe = 9.0
        
    if min_yoe <= yoe <= max_yoe:
        return 1.0
    elif yoe < min_yoe:
        # Under-experience: steep penalty (1.0 to 0.0 over 3 years)
        diff = min_yoe - yoe
        return float(max(0.0, 1.0 - diff * 0.33))
    else:
        # Over-experience: gentle penalty (1.0 to 0.0 over 10 years)
        diff = yoe - max_yoe
        return float(max(0.0, 1.0 - diff * 0.1))

def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    a_norm = np.linalg.norm(a)
    b_norm = np.linalg.norm(b)
    if a_norm == 0.0 or b_norm == 0.0:
        return 0.0
    return float(np.dot(a, b) / (a_norm * b_norm))

def compute_experience_fit(yoe: float, min_yoe: float, max_yoe: float,
                           career_embedding: np.ndarray, jd_career_embedding: np.ndarray) -> float:
    # 1. Compute years of experience score
    yoe_score = yoe_band_score(yoe, min_yoe, max_yoe)
    
    # 2. Compute career trajectory relevance
    if career_embedding is not None and jd_career_embedding is not None:
        traj_sim = cosine_similarity(career_embedding, jd_career_embedding)
        # Normalise to [0, 1]
        traj_score = max(0.0, min(1.0, (traj_sim + 1.0) / 2.0))
    else:
        traj_score = 0.5
        
    # Combine: 0.5 * yoe_score + 0.5 * traj_score
    return float(0.5 * yoe_score + 0.5 * traj_score)
