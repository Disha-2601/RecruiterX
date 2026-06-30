import os
import sys
import re
import json
from docx import Document

def parse_docx(file_path):
    doc = Document(file_path)
    full_text = []
    for para in doc.paragraphs:
        full_text.append(para.text)
    for table in doc.tables:
        for row in table.rows:
            row_text = [cell.text for cell in row.cells]
            full_text.append(" | ".join(row_text))
    return "\n".join(full_text)

def main():
    if len(sys.argv) < 2:
        print("Usage: python parse_jd.py <path_to_jd.docx>")
        sys.exit(1)
        
    jd_path = sys.argv[1]
    if not os.path.exists(jd_path):
        print(f"Error: {jd_path} does not exist.")
        sys.exit(1)
        
    print(f"Parsing job description: {jd_path}")
    text = parse_docx(jd_path)
    
    # 1. Extract years of experience
    # Looking for patterns like "5-9 years" or "5 to 9 years"
    min_yoe = 0
    max_yoe = 50
    yoe_match = re.search(r"(\d+)\s*[-–to]+\s*(\d+)\s*years", text, re.IGNORECASE)
    if yoe_match:
        min_yoe = int(yoe_match.group(1))
        max_yoe = int(yoe_match.group(2))
        print(f"Extracted YoE range: {min_yoe} - {max_yoe} years")
    else:
        # Fallback to single numbers
        min_yoe_match = re.search(r"(\d+)\s*\+\s*years", text, re.IGNORECASE)
        if min_yoe_match:
            min_yoe = int(min_yoe_match.group(1))
            print(f"Extracted minimum YoE: {min_yoe}+ years")
            
    # 2. Extract locations
    locations = ["Pune", "Noida", "Hyderabad", "Mumbai", "Delhi NCR", "Bangalore"]
    preferred_locations = []
    for loc in locations:
        if re.search(rf"\b{re.escape(loc)}\b", text, re.IGNORECASE):
            preferred_locations.append(loc)
    print(f"Extracted preferred locations: {preferred_locations}")
    
    # 3. Extract work mode
    work_mode = "onsite"
    if re.search(r"hybrid|remote|flexible", text, re.IGNORECASE):
        work_mode = "hybrid" # default to hybrid if mentioned
    print(f"Extracted work mode: {work_mode}")
    
    # 4. Extract notice period
    notice_period = 30 # default
    notice_match = re.search(r"(\d+)\s*-day\s*notice", text, re.IGNORECASE)
    if notice_match:
        notice_period = int(notice_match.group(1))
    print(f"Extracted notice period: {notice_period} days")
    
    # 5. Extract salary band (if stated)
    salary_band = {"min": 0.0, "max": 0.0}
    salary_match = re.search(r"₹?\s*(\d+)\s*[-–to]+\s*(\d+)\s*(LPA|Lakhs)", text, re.IGNORECASE)
    if salary_match:
        salary_band["min"] = float(salary_match.group(1))
        salary_band["max"] = float(salary_match.group(2))
        print(f"Extracted salary band: {salary_band['min']} - {salary_band['max']} LPA")
        
    # 6. Extract/Map required skills and nice-to-have skills
    # Since we need to match candidate skills exactly or fuzzy-match them,
    # let's define the set of target skills we look for based on candidate schema/common skills
    # We will map them to importance weights.
    
    # Map keywords to candidate skill names and weights
    required_skill_mappings = {
        "Python": 1.0,
        "RAG": 0.9,
        "Vector DBs": 1.0,
        "Vector Databases": 1.0,
        "sentence-transformers": 0.9,
        "Search Infrastructure": 0.9,
        "Information Retrieval": 0.8,
        "Semantic Search": 0.9,
        "NDCG": 0.8,
        "MAP": 0.8,
        "MRR": 0.8,
        "A/B Testing": 0.8,
        "Ranking Evaluation": 0.8,
        "Evaluation Frameworks": 0.8,
        "Machine Learning": 0.8,
        "NLP": 0.8,
        "SQL": 0.7,
        "Spark": 0.7,
        "Airflow": 0.7,
        "Data Engineering": 0.7,
    }
    
    nice_to_have_skill_mappings = {
        "LLM Fine-tuning": 0.4,
        "Fine-tuning LLMs": 0.4,
        "LoRA": 0.4,
        "QLoRA": 0.4,
        "PEFT": 0.4,
        "Learning-to-Rank": 0.4,
        "XGBoost": 0.4,
        "LightGBM": 0.4,
        "Random Forest": 0.3,
        "HR-tech": 0.3,
        "Marketplace Products": 0.3,
        "Distributed Systems": 0.3,
        "Large-Scale Inference": 0.3,
        "Inference Optimization": 0.3,
        "Open-Source Contributions": 0.2,
        "Open-Source": 0.2,
    }
    
    required_skills = {}
    nice_to_have_skills = {}
    
    # Let's see if these keywords or synonyms appear in the text
    for skill_name, weight in required_skill_mappings.items():
        pattern = rf"\b{re.escape(skill_name.lower())}\b"
        if re.search(pattern, text.lower()):
            required_skills[skill_name] = weight
            
    for skill_name, weight in nice_to_have_skill_mappings.items():
        pattern = rf"\b{re.escape(skill_name.lower())}\b"
        if re.search(pattern, text.lower()):
            nice_to_have_skills[skill_name] = weight
            
    # Always guarantee a set of core skills for the ranker fallback if parsing was too strict
    if not required_skills:
        required_skills = {
            "Python": 1.0,
            "RAG": 0.9,
            "Vector DBs": 1.0,
            "NLP": 0.8,
            "Machine Learning": 0.8,
            "Evaluation Frameworks": 0.8
        }
    if not nice_to_have_skills:
        nice_to_have_skills = {
            "Fine-tuning LLMs": 0.4,
            "LoRA": 0.4,
            "XGBoost": 0.4,
            "Distributed Systems": 0.3
        }
        
    jd_requirements = {
        "title": "Senior AI/ML Engineer",
        "required_skills": required_skills,
        "nice_to_have_skills": nice_to_have_skills,
        "min_years_experience": min_yoe,
        "max_years_experience": max_yoe,
        "salary_band_inr_lpa": salary_band,
        "work_mode": work_mode,
        "preferred_locations": preferred_locations,
        "notice_period_days": notice_period,
        "jd_text_for_embedding": text
    }
    
    # Create cache dir if not exists
    os.makedirs("cache", exist_ok=True)
    
    # Save to file
    out_path = os.path.join("cache", "jd_requirements.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(jd_requirements, f, indent=2)
        
    print(f"Successfully wrote JD requirements to {out_path}")

if __name__ == "__main__":
    main()
