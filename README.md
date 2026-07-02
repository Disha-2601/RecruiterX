# Recruiter-X Candidate Ranker & Full-Stack Portal

This repository contains a dual-interface talent evaluation system:
1. **Next.js & FastAPI Full-Stack Web Portal (NPM Way)**: A responsive recruiter dashboard for managing organizations, projects, and candidates with visual metrics.
2. **Offline Vectorized Ranking Engine (Direct Python/CLI Way)**: A fast candidate scoring script that processes 100,000 candidates against job descriptions in under 30 seconds.

---

## Option A: Full-Stack Web Application (NPM Way)

This method starts both the interactive Next.js frontend and the FastAPI backend database server concurrently.

### Prerequisites
* **Node.js** (v18 or higher)
* **Python 3.11** installed and configured in a virtual environment under the `redrob-ranker` directory.

### Setup and Execution

1. **Set up the Python Virtual Environment** (needed for the FastAPI dev server):
   ```bash
   cd redrob-ranker
   python -m venv .venv
   .venv\Scripts\activate
   pip install -r requirements.txt
   cd ..
   ```

2. **Install Frontend Dependencies**:
   ```bash
   npm install
   ```

3. **Start the Concurrent Development Servers**:
   ```bash
   npm run dev
   ```
   *This command runs Next.js (`localhost:3000`) and the FastAPI backend database API (`127.0.0.1:8000`) concurrently.*

4. **Access the Interfaces**:
   * **Recruiter Portal**: Open [http://localhost:3000](http://localhost:3000) in your browser.
   * **API Swagger Docs**: Open [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

---

##  Option B: Vectorized Ranking Engine (Direct Python/CLI Way)

This method operates purely on the command line to parse job descriptions, precompute semantic embeddings, and rank candidates.

### Setup and Execution

1. **Navigate to the Ranker Directory**:
   ```bash
   cd redrob-ranker
   ```

2. **Configure Virtual Environment & Install Requirements**:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Run Offline Indexing** (not timed):
   Parses `candidates.jsonl` to precompute candidate features, skill embeddings, and career trajectory embeddings using `SentenceTransformer`:
   ```bash
   python build_index.py "path/to/candidates.jsonl"
   ```

4. **Run Candidate Ranking** (timed - under 30 seconds):
   Loads the precomputed embeddings and calculates candidate scores against a job description docx:
   ```bash
   python rank.py --candidates "path/to/candidates.jsonl" --jd "path/to/job_description.docx" --out "submission.csv"
   ```

5. **Validate Output Formatting**:
   ```bash
   python "path/to/validate_submission.py" submission.csv
   ```

---

##  Scoring & Architecture Details

The direct CLI ranker calculates candidate matches using the following weighted structure:

| Scoring Layer | Weight | Details |
|---|---|---|
| **Skill Match** | `40%` | 50% structured + 20% assessment scores + 30% embedding similarity |
| **Experience Fit** | `25%` | 50% trapezoidal YoE band + 50% duration-weighted career trajectory relevance |
| **Behavioral Signals** | `20%` | 90% reachability (availability, responsiveness) + 5% GitHub + 5% Offer acceptance |
| **Education** | `8%` | Tier matching: Tier 1 (1.0), Tier 2 (0.75), Tier 3/4/Unknown (0.5/0.4) |
| **Logistics Fit** | `7%` | 40% location + 30% work mode + 30% notice period |

*Consistency Gate*: Multiplicative penalty based on 5 automated consistency/honeypot filters.
