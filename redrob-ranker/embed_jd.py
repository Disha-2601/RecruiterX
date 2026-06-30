import os
import json
import numpy as np
from sentence_transformers import SentenceTransformer

def main():
    print("Loading SentenceTransformer model for JD embedding...")
    model = SentenceTransformer("all-MiniLM-L6-v2")
    
    jd_req_path = os.path.join("cache", "jd_requirements.json")
    if not os.path.exists(jd_req_path):
        print(f"Error: {jd_req_path} does not exist.")
        return
        
    print("Embedding JD requirements...")
    with open(jd_req_path, "r", encoding="utf-8") as f:
        jd_req = json.load(f)
        
    # Concatenate JD required skills
    jd_skills_text = ", ".join(jd_req.get("required_skills", {}).keys())
    if not jd_skills_text.strip():
        # Fallback to general text if no skills parsed
        jd_skills_text = jd_req.get("title", "Senior AI/ML Engineer")
        
    # Encode skills
    jd_skill_emb = model.encode([jd_skills_text], convert_to_numpy=True)[0]
    os.makedirs("cache", exist_ok=True)
    np.save(os.path.join("cache", "jd_skill_embedding.npy"), jd_skill_emb)
    
    # JD full text
    jd_text = jd_req.get("jd_text_for_embedding", "")
    if not jd_text.strip():
        jd_text = jd_skills_text
        
    jd_career_emb = model.encode([jd_text], convert_to_numpy=True)[0]
    np.save(os.path.join("cache", "jd_career_embedding.npy"), jd_career_emb)
    print("Saved JD embeddings (jd_skill_embedding.npy and jd_career_embedding.npy) successfully.")

if __name__ == "__main__":
    main()
