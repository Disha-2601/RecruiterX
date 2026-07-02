# Redrob Candidate Ranker

This repository houses the candidate ranking system designed for the Redrob Senior AI/ML Engineer position. It scores and ranks 100,000 candidates based on job description fit, skills, career history, behavioral signals, and consistency constraints.

## 🚀 One-Liner
A fully offline, vectorized ranking engine that scores 100,000 candidates and generates human-readable reasoning in under 30 seconds on a standard 16GB CPU machine.

---

## 🏗️ Architecture

```
                                  [ job_description.docx ]
                                             │
                                             ▼
                                      [ parse_jd.py ]
                                             │
                                             ▼
                                  jd_requirements.json
                                             │
                                             ▼
[ candidates.jsonl ] ──► [ build_index.py ] (Offline / Multi-process)
                                 │
                                 ├──► candidate_features.parquet
                                 ├──► skill_embeddings.npy
                                 ├──► career_embeddings.npy
                                 ├──► jd_skill_embedding.npy
                                 └──► jd_career_embedding.npy
                                             │
                                             ▼
                                       [ rank.py ] (Online Timed Step)
                                             │
                                             ▼
                                      [ submission.csv ]
```

### 1. Offline Indexing (`build_index.py`)
Parses `candidates.jsonl` and builds optimized index matrices. It runs `SentenceTransformer(all-MiniLM-L6-v2)` across a multi-process pool utilizing available CPU cores in parallel to generate:
* `skill_embeddings.npy` (100K x 384)
* `career_embeddings.npy` (100K x 384, duration-weighted average of role descriptions)
* `candidate_features.parquet` (compressed flat features and JSON fields)

### 2. Timed Ranking (`rank.py`)
Loads precomputed artifacts and performs fast, vectorized scoring in Pandas and NumPy:
* **Skill Match**: Cosine similarity of skill embeddings + self-claimed proficiency matching + tested assessment score boosts.
* **Experience Fit**: Stated YoE score using a trapezoidal decay band + career trajectory semantic relevance.
* **Behavioral**: Weighted sum of open-to-work flag, recent activity, recruiter response rate/time, interview completion, and platform trust indicators (with `-1` sentinel masking).
* **Logistics Fit**: Location preference, hybrid/flexible work mode fit, and notice period decay scoring.
* **Consistency Gate**: Multiplicative penalty based on 5 automated honeypot/consistency flags.

---

## ⚙️ Weighted Scoring Formula

Our system uses the following weights for the composite candidate score:

| Scoring Layer | Weight | Details |
|---|---|---|
| **Skill Match** | `40%` | 50% structured + 20% assessment scores + 30% embedding similarity |
| **Experience Fit** | `25%` | 50% trapezoidal YoE band + 50% duration-weighted career trajectory relevance |
| **Behavioral Signals** | `20%` | 90% reachability (recency, availability, responsiveness) + 5% GitHub + 5% Offer acceptance |
| **Education** | `8%` | Best tier matching: Tier 1 (1.0), Tier 2 (0.75), Tier 3/4/Unknown (0.5/0.4) |
| **Logistics Fit** | `7%` | 40% location + 30% work mode + 30% notice period |

---

## 🛠️ Reproduction Instructions

### 1. Environment Setup
The ranker requires **Python 3.11** (since compile steps for PyTorch/NumPy can fail on Windows on Python 3.14).
```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Run Offline Indexing (Not timed)
Calculates all candidate embeddings and saves them to the cache.
```bash
python build_index.py "c:\path\to\candidates.jsonl"
```

### 3. Run Ranking (Timed - under 30 seconds)
```bash
python rank.py --candidates "c:\path\to\candidates.jsonl" --jd "c:\path\to\job_description.docx" --out "submission.csv"
```

### 4. Validate Submission
Run the official judge script on the output file to verify formatting:
```bash
python "c:\path\to\validate_submission.py" submission.csv
```
