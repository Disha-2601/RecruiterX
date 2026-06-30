import numpy as np
from features.experience_fit import yoe_band_score, cosine_similarity, compute_experience_fit

def test_yoe_band_score():
    # Stated range: 5 to 9 years
    assert yoe_band_score(7.0, 5.0, 9.0) == 1.0
    assert yoe_band_score(5.0, 5.0, 9.0) == 1.0
    assert yoe_band_score(9.0, 5.0, 9.0) == 1.0
    
    # Under-experience: 3 years (2 years under)
    # score: 1.0 - 2 * 0.33 = 0.34
    assert 0.33 <= yoe_band_score(3.0, 5.0, 9.0) <= 0.35
    
    # Over-experience: 12 years (3 years over)
    # score: 1.0 - 3 * 0.1 = 0.7
    assert yoe_band_score(12.0, 5.0, 9.0) == 0.7
    
    # Missing/invalid YoE
    assert yoe_band_score(None, 5.0, 9.0) == 0.0
    assert yoe_band_score(-2.0, 5.0, 9.0) == 0.0

def test_cosine_similarity():
    a = np.array([1.0, 0.0, 0.0])
    b = np.array([1.0, 0.0, 0.0])
    c = np.array([0.0, 1.0, 0.0])
    
    assert cosine_similarity(a, b) == 1.0
    assert cosine_similarity(a, c) == 0.0
    assert cosine_similarity(np.zeros(3), a) == 0.0

def test_compute_experience_fit():
    career_emb = np.array([1.0, 0.0, 0.0])
    jd_emb = np.array([1.0, 0.0, 0.0])
    
    # In band, perfect similarity
    # traj_score = (1.0 + 1.0) / 2 = 1.0
    # yoe_score = 1.0
    # fit = 0.5 * 1.0 + 0.5 * 1.0 = 1.0
    fit = compute_experience_fit(7.0, 5.0, 9.0, career_emb, jd_emb)
    assert fit == 1.0
