# PRD — Redrob Candidate Ranker: "The Interrogation Layer"
**For: Antigravity (AI agentic coding environment)**
**Goal: Build a 100K-candidate ranking system where reasoning IS the scoring engine, not a label bolted on after.**

---

## 0. One-paragraph brief (read this first, always)

We are not building a black-box ranker that scores candidates and then writes a nice sentence afterward. We are building a system where every candidate is run through four honest checks — story consistency, claimed-vs-tested skill mismatch, reachability, and job fit — and those four checks directly produce both the score AND the human-readable reasoning. The reasoning is never separately generated; it is a direct readout of the same numbers that built the score. This must work end-to-end on 100,000 candidates, fully offline, in under 5 minutes, on a CPU-only 16GB machine, using one single command.

---

## 1. Hard constraints (non-negotiable, violating any of these = disqualification)

- The ranking step (`rank.py`) must run in **≤ 5 minutes wall-clock**, **≤ 16GB RAM**, **CPU only**, **zero network calls**, **≤ 5GB disk**.
- Output: exactly **100 rows**, ranks **1–100** each used exactly once, columns in this exact order: `candidate_id,rank,score,reasoning`.
- `score` must be **strictly non-increasing** as rank increases (rank 1 has the highest score).
- Every `candidate_id` must exist in the source `candidates.jsonl` and appear exactly once.
- Filename = team's registered ID, `.csv` extension, UTF-8 encoding.
- Network calls (e.g. downloading the embedding model) are only allowed in `build_index.py`, which is NOT part of the timed step.

---

## 2. Repo structure to scaffold first

```
redrob-ranker/
├── README.md
├── requirements.txt
├── submission_metadata.yaml
├── parse_jd.py
├── build_index.py
├── rank.py
├── features/
│   ├── __init__.py
│   ├── skill_match.py
│   ├── experience_fit.py
│   ├── behavioral.py
│   ├── consistency_gate.py
│   └── reasoning_generator.py
├── tests/
│   ├── test_skill_match.py
│   ├── test_consistency_gate.py
│   ├── test_experience_fit.py
│   └── test_reasoning_generator.py
├── cache/
│   └── .gitkeep
└── sandbox/
    └── app.py
```

Build in this order. Each numbered section below is one self-contained task — finish, test, commit, move to the next. Do not skip ahead or merge steps.

---

## 3. Data contracts (exact shapes — do not guess these, they come from the real schema)

**Candidate record** (one line of `candidates.jsonl`):
```json
{
  "candidate_id": "CAND_0000001",
  "profile": {
    "years_of_experience": 6.9,
    "current_title": "...", "current_company": "...",
    "summary": "...", "headline": "...",
    "location": "...", "country": "..."
  },
  "career_history": [
    {"company": "...", "title": "...", "duration_months": 27,
     "is_current": true, "start_date": "...", "end_date": null,
     "description": "..."}
  ],
  "education": [{"institution": "...", "tier": "tier_1..tier_4|unknown"}],
  "skills": [
    {"name": "...", "proficiency": "beginner|intermediate|advanced|expert",
     "endorsements": 3, "duration_months": 13}
  ],
  "redrob_signals": {
    "open_to_work_flag": true,
    "last_active_date": "2026-05-20",
    "recruiter_response_rate": 0.34,
    "interview_completion_rate": 0.71,
    "skill_assessment_scores": {"NLP": 38.8, ...},
    "notice_period_days": 60,
    "expected_salary_range_inr_lpa": {"min": 18.7, "max": 36.1},
    "preferred_work_mode": "onsite|hybrid|remote|flexible",
    "willing_to_relocate": false,
    "github_activity_score": 9.2,
    "offer_acceptance_rate": 0.58
  }
}
```

**Critical gotcha — implement this correctly, it's a real bug if missed:** `github_activity_score` uses `-1` to mean "no GitHub linked," and `offer_acceptance_rate` uses `-1` to mean "no offer history." These are missing-data sentinels, NOT real low scores. Any feature function touching these two fields must mask `-1` to a neutral/missing value before using it in a weighted sum — never let `-1` get treated as "this candidate scored -1."

---

## 4. Task 1 — `parse_jd.py`

**Purpose:** Run once (not part of the timed step). Reads the job description and outputs a static `cache/jd_requirements.json`.

**Build:**
- Input: path to `job_description.md`.
- Extract: required skills (list, each with an importance weight 0–1), nice-to-have skills, min/max years experience, seniority level, location/work-mode preference, salary band if stated.
- Use regex/keyword extraction for structured patterns ("3–5 years", "₹X–Y LPA", "remote/hybrid/onsite").
- Output JSON shape:
```json
{
  "required_skills": {"Python": 1.0, "RAG": 0.9, "Vector DBs": 0.7},
  "nice_to_have_skills": {"Kubernetes": 0.3},
  "min_years_experience": 4, "max_years_experience": 10,
  "salary_band_inr_lpa": {"min": 20, "max": 35},
  "work_mode": "hybrid", "location_preference": "Bangalore"
}
```
**Acceptance test:** run on the real `job_description.md`, print the JSON, manually sanity-check it matches what the JD actually says.

---

## 5. Task 2 — `build_index.py`

**Purpose:** Run once, network allowed, unlimited time. Reads the full 100K candidate pool and produces all precomputed artifacts `rank.py` will load instantly.

**Build:**
- Stream-parse `candidates.jsonl` (use `orjson`, not stdlib `json`, for speed). Do not hold the raw nested objects AND a flattened table in memory at once — extract flat fields, discard the raw object per record.
- For every candidate, build one concatenated "skill text" string (skill names joined). Embed all 100K skill-text strings using `sentence-transformers/all-MiniLM-L6-v2` (downloaded here, cached to disk — this is the only place network is allowed).
- Save: `cache/skill_embeddings.npy` (100000 × 384 matrix), `cache/candidate_features.parquet` (flat feature table: candidate_id + all raw fields needed downstream), `cache/candidate_ids.npy` (id order matching the embedding matrix rows).
- Print memory/time used at the end so we know the budget.

**Acceptance test:** run on the full `candidates.jsonl`, confirm output files exist, confirm row counts all match 100,000, confirm no raw candidate JSON objects are held in memory by the end (use a memory profiler print or `tracemalloc`).

---

## 6. Task 3 — `features/skill_match.py`

**Purpose:** Score how well a candidate's skills match the JD, combining structured matching with embedding similarity.

**Build:**
```python
PROFICIENCY_WEIGHTS = {"beginner": 0.25, "intermediate": 0.5, "advanced": 0.75, "expert": 1.0}

def structured_skill_score(candidate_skills: list[dict], jd_skill_weights: dict[str, float]) -> float:
    # normalize skill names (lowercase, strip) before matching against jd_skill_weights keys
    # for each candidate skill that matches a JD-required skill:
    #   contribution = jd_weight * PROFICIENCY_WEIGHTS[proficiency] * recency/endorsement modifier
    # sum contributions, divide by sum(jd_skill_weights.values()) to normalize to 0-1
    ...

def assessment_boost(redrob_signals: dict, jd_skill_weights: dict) -> float:
    # for any JD-required skill present in skill_assessment_scores, this is a TESTED score
    # (0-100), not self-reported — weight this MORE than proficiency self-labels when both exist
    ...

def skill_match_score(candidate, skill_embedding, jd_skill_embedding, jd_skill_weights) -> float:
    structured = structured_skill_score(candidate["skills"], jd_skill_weights)
    tested = assessment_boost(candidate["redrob_signals"], jd_skill_weights)
    embedding_sim = cosine_similarity(skill_embedding, jd_skill_embedding)  # precomputed, vectorized
    return 0.5 * structured + 0.2 * tested + 0.3 * embedding_sim
```
Final weighting is a starting point — tunable in section 11.

**Acceptance test:** write `tests/test_skill_match.py` with at least 3 hand-built cases: (a) perfect skill match scores near 1.0, (b) zero overlap scores near 0.0, (c) a candidate whose self-claimed proficiency is "expert" but whose tested `skill_assessment_scores` is low scores LOWER than a candidate with honest "intermediate" + matching test score — this proves the tested-score weighting is actually doing something.

---

## 7. Task 4 — `features/experience_fit.py`

**Purpose:** Score years-of-experience fit and career trajectory relevance.

**Build:**
- Trapezoidal scoring against `jd_requirements.json`'s min/max years: full score inside the band; decay outside it, penalizing under-experience more steeply than over-experience (real recruiter intuition — being 2 years short is worse than being 2 years over).
- Separately score trajectory relevance: for each `career_history` entry, compare its title+description against the JD's required-skills text (reuse the MiniLM embeddings from `build_index.py`), weight each entry's contribution by its `duration_months` so a 6-month detour doesn't outweigh 4 years of directly relevant work.
- Combine: `experience_fit = 0.5 * years_band_score + 0.5 * trajectory_relevance_score`.

**Acceptance test:** `tests/test_experience_fit.py` — candidate exactly in the band scores ~1.0; candidate 5 years under scores notably lower than candidate 5 years over; candidate whose entire career history is irrelevant to the JD scores low trajectory relevance even if years_of_experience matches.

---

## 8. Task 5 — `features/behavioral.py`

**Purpose:** Score reachability/availability — a perfect-on-paper candidate who's unreachable is not actually useful.

**Build:**
```python
def availability_score(signals: dict) -> float:
    recency = exp(-days_since(signals["last_active_date"]) / 90)
    return 0.5 * float(signals["open_to_work_flag"]) + 0.5 * recency

def responsiveness_score(signals: dict) -> float:
    return signals["recruiter_response_rate"] / (1 + signals["avg_response_time_hours"] / 24)

def reliability_score(signals: dict) -> float:
    return signals["interview_completion_rate"]

def trust_score(signals: dict) -> float:
    return mean([signals["verified_email"], signals["verified_phone"], signals["linkedin_connected"]])

def behavioral_score(signals: dict) -> float:
    return 0.35*availability_score(signals) + 0.35*responsiveness_score(signals) \
         + 0.20*reliability_score(signals) + 0.10*trust_score(signals)
```
**Remember the `-1` sentinel rule from Section 3** — this file does not touch `github_activity_score` or `offer_acceptance_rate` directly in this version (those are minor signals, fold in only if time permits, with explicit `-1` masking).

**Acceptance test:** `tests/test_behavioral_score.py` — candidate active today + high response rate scores near top; candidate inactive 6 months + low response rate scores near bottom; verify no crash/garbage output on a candidate with `recruiter_response_rate == 0`.

---

## 9. Task 6 — `features/consistency_gate.py` — THE differentiator, build this carefully

**Purpose:** Catch honeypots and inconsistent stories. Returns a penalty 0–1 applied **multiplicatively**, not added/subtracted, so a honeypot can't just get nudged down — it gets crushed even if its surface skill-match looks strong.

**Build:**
```python
def consistency_penalty(candidate: dict) -> tuple[float, list[str]]:
    """Returns (penalty in [0,1], list of human-readable flag strings for reasoning_generator)"""
    penalty = 0.0
    flags = []

    # Check A: claimed expert proficiency with near-zero duration
    for s in candidate["skills"]:
        if s["proficiency"] == "expert" and s.get("duration_months", 0) <= 2:
            penalty += 0.3
            flags.append(f"claims expert-level {s['name']} with under 2 months of use")

    # Check B: years_of_experience doesn't match summed career_history duration
    yoe_months = candidate["profile"]["years_of_experience"] * 12
    sum_months = sum(j["duration_months"] for j in candidate["career_history"])
    if abs(yoe_months - sum_months) > 24:
        penalty += 0.3
        flags.append(f"claims {candidate['profile']['years_of_experience']} years experience but career history only sums to {round(sum_months/12,1)} years")

    # Check C: overlapping career_history date ranges without is_current explaining it
    # sort by start_date, check for overlap between non-current roles
    overlaps = find_overlapping_roles(candidate["career_history"])
    if overlaps:
        penalty += 0.25
        flags.append("overlapping employment dates that don't align with stated current role")

    # Check D: claimed skill vs tested score, large mismatch (also feeds reasoning, smaller penalty)
    for skill_name, tested_score in candidate["redrob_signals"].get("skill_assessment_scores", {}).items():
        claimed = next((s for s in candidate["skills"] if s["name"] == skill_name), None)
        if claimed and PROFICIENCY_WEIGHTS[claimed["proficiency"]] * 100 - tested_score > 40:
            penalty += 0.15
            flags.append(f"claims {claimed['proficiency']} {skill_name} but tested score is only {tested_score}/100")

    return min(penalty, 1.0), flags
```

**Acceptance test:** `tests/test_consistency_gate.py` — build a synthetic clean candidate (penalty should be 0.0, no flags), a synthetic honeypot matching each check pattern individually (each should trigger its specific flag and a nonzero penalty), and confirm `final_score = raw_score * (1 - penalty)` actually drags a high-raw-score honeypot below a moderate, consistent real candidate. This last assertion is the one that proves the gate works — write it explicitly.

---

## 10. Task 7 — `features/reasoning_generator.py`

**Purpose:** Generate the one-sentence reasoning column directly FROM the same feature breakdown that produced the score — never a separately/freely generated sentence.

**Build:**
```python
def generate_reasoning(candidate: dict, feature_breakdown: dict, flags: list[str]) -> str:
    # feature_breakdown = {"skill_match": 0.81, "experience_fit": 0.74, "behavioral": 0.6, ...}
    top_strengths = sorted(feature_breakdown.items(), key=lambda x: -x[1])[:2]
    strength_phrases = [describe_strength(candidate, name, val) for name, val in top_strengths]

    concern_phrase = None
    if flags:
        concern_phrase = flags[0]  # the consistency gate's own flags, already specific
    else:
        concern_phrase = describe_minor_concern(candidate)  # e.g. long notice period, salary mismatch — only if real

    return assemble_sentence(candidate["profile"]["current_title"],
                              candidate["profile"]["years_of_experience"],
                              strength_phrases, concern_phrase)
```

**Hard rule:** every word in the output must trace back to an actual field value pulled from `candidate` or `feature_breakdown`. No free-text LLM call with an open-ended prompt like "write something nice about this candidate" — that produces exactly the generic/templated reasoning the spec penalizes. If you want LLM-polished phrasing, it must be constrained to rephrasing a pre-built fact list, with the facts themselves coming from this deterministic extraction — never inventing new facts.

**Acceptance test:** `tests/test_reasoning_generator.py` — generate reasoning for 10 synthetic candidates with different feature breakdowns and confirm: (a) every numeric/skill claim in the output sentence is traceable to the input candidate dict, (b) sentences differ from each other (not templated identically), (c) a candidate with consistency flags gets a sentence that mentions a real concern, not blanket praise.

---

## 11. Task 8 — `rank.py` — the single command Stage 3 reproduces

**Purpose:** Tie everything together. THIS is what gets timed and sandboxed.

**Build:**
```
python rank.py --candidates candidates.jsonl --jd job_description.md --out submission.csv
```
- Load `cache/jd_requirements.json` (already built by `parse_jd.py`), `cache/skill_embeddings.npy`, `cache/candidate_features.parquet` (already built by `build_index.py`). Loading cached artifacts is fast — do NOT recompute embeddings here.
- For every candidate (vectorized with pandas/numpy, NOT a per-row Python loop over 100K):
  - compute `skill_match`, `experience_fit`, `behavioral`, plus a small `education` and `logistics_fit` term
  - compute `consistency_penalty` and `flags`
  - `raw_score = 0.40*skill_match + 0.25*experience_fit + 0.20*behavioral + 0.08*education + 0.07*logistics_fit`
  - `final_score = raw_score * (1 - consistency_penalty)`
- Sort descending by `final_score`, take top 100.
- Generate reasoning per top-100 candidate (this can be a small loop — only 100 rows, no performance concern here).
- Assign rank 1–100, write `candidate_id,rank,score,reasoning` to the output CSV, ties broken by `candidate_id` ascending.
- Print wall-clock time and peak memory at the end.

**Acceptance test:** run the full command end-to-end on the full 100K pool, confirm: runtime under 5 minutes, output has exactly 100 rows + header, ranks 1–100 each exactly once, score is strictly non-increasing, every candidate_id exists in the source file and is unique, zero network calls made (verify by running with network disabled).

---

## 12. Task 8.5 — Robustness pass (mandatory, before tuning weights — do not skip)

**Why this exists:** `sample_candidates.json` is only 50 clean records. The real `candidates.jsonl` has 100,000, and at that scale it WILL contain nulls, empty lists, inconsistent skill-name spellings, and edge cases the sample never showed us. Every function built in Tasks 3–7 must be re-verified against deliberately broken/edge-case inputs, not just the clean sample, before this system is trusted on the real pool. Nothing in this build should be tuned to work only on the sample data — this task is where that's verified directly.

**Build and test, one by one:**

- **Empty `skills` list.** `skill_match_score` must return a valid low score (not crash, not NaN) when `candidate["skills"] == []`.
- **Empty `career_history`.** Should not occur per schema (`minItems: 1`), but code defensively anyway — `experience_fit` must not divide by zero or crash on an empty list.
- **Missing `skill_assessment_scores` key, or an empty dict.** `assessment_boost` must treat this as "no tested data," not as a zero score that drags the candidate down — these are different things.
- **`end_date: null` on a non-current role** (a data inconsistency, not a schema violation per se) — `consistency_gate`'s overlap check must not crash, and should flag this as a minor inconsistency rather than silently ignoring it.
- **`-1` sentinels on `github_activity_score` and `offer_acceptance_rate`** — confirm masked to neutral, not treated as real low scores (already specified in Section 3/8 — re-verify here with an explicit test).
- **Skill name variation.** Build a normalization step (lowercase, strip whitespace, strip punctuation, collapse common separators like `-`/`_`/space) before any exact-match comparison. Then rely on the embedding-similarity term (already in `skill_match.py`) to catch variants normalization can't handle (e.g. "ML" vs "Machine Learning" are different strings even normalized). Test explicitly: confirm "Machine Learning", "machine-learning", and "ML" all produce a nonzero structured-or-embedding match against a JD requiring "Machine Learning."
- **`parse_jd.py` generality — the highest-risk spot in the whole system.** This must NOT be tuned to the wording of one specific JD. Write 2–3 deliberately differently-phrased fake job descriptions yourself (different ways of stating years of experience, different skill-list formatting, different salary notations, different section ordering) and confirm `parse_jd.py` extracts sensible requirements from all of them, not just the real `job_description.md`. If it only works on one phrasing, rewrite the extraction logic to be pattern-general, not example-specific, before moving on.
- **Threshold sanity check on the real pool.** Once the full `candidates.jsonl` is available, histogram the actual distribution of `years_of_experience*12 - sum(duration_months)` and `proficiency=expert & duration_months` across all 100K real candidates — confirm the consistency-gate thresholds (24-month mismatch, ≤2-month expert claim) are catching genuine outliers, not accidentally flagging a normal slice of honest candidates. Adjust thresholds based on the REAL distribution, never the 50-sample alone.

**Acceptance test:** `tests/test_robustness.py` — one test per bullet above, each using a synthetic candidate dict constructed by hand to trigger that specific edge case. All must pass without crashing and without producing an unreasonable score. This file is run against the full pool, not just the sample, before Task 9.

---

## 13. Task 9 — `sandbox/app.py`

**Purpose:** A small Streamlit app for HuggingFace Spaces — proves the system is reproducible, not a product demo.

**Build:**
- File upload widget for a small candidate sample (≤100 candidates, JSONL) + a text box for the JD.
- "Run Ranking" button → calls the same `rank.py` logic (import as a function, don't shell out) → displays a results table: candidate_id, rank, score, reasoning.
- Each row expandable to show the feature breakdown (`skill_match`, `experience_fit`, `behavioral`, `consistency_penalty`) that produced that score — this transparency is the actual point of the sandbox.
- Keep it minimal. No styling work beyond Streamlit defaults.

**Acceptance test:** deploy to HuggingFace Spaces free tier, test in an incognito browser window, confirm it runs end-to-end on a small sample within the 5-minute budget.

---

## 14. Task 10 — Tests, README, metadata (final packaging)

- Run full `pytest` suite, all green.
- `README.md`: project one-liner, the `build_index.py` → `rank.py` two-step architecture explained in 2-3 sentences, the exact reproduction command, a weights table (Section 11's weights) with one line of rationale per weight, an honest "what we'd improve with more time" section.
- `submission_metadata.yaml`: filled per the portal template — team name, contacts, GitHub URL, sandbox URL, AI tools declared honestly, compute environment summary, methodology summary (≤200 words).
- `requirements.txt`: pinned versions for everything used.
- Fresh-clone test: clone the repo into a clean directory, run the README's exact single command from scratch, confirm it reproduces `submission.csv` identically.

---

## 15. Weight tuning loop (do this after Task 8.5 passes, not before)

There is no live leaderboard, so your only validation is manual inspection:
1. Run `rank.py` on the full pool.
2. Manually read the top 30 and bottom 20 of the output against the actual JD — do they make sense to a human?
3. Adjust the weights in Section 11's `raw_score` formula based on what looks wrong.
4. Re-run, re-inspect. Repeat 2-3 times max — don't over-tune against your own intuition with no ground truth to check against.
5. Run the honeypot check on the full top-100: confirm 0 honeypots present (or well under the 10% disqualification threshold).

---

## 16. Git discipline (Antigravity should commit after every numbered task, not at the end)

One commit per completed + tested task above, with a message describing what was built and why (e.g. `"Add consistency gate with multiplicative penalty — catches expert-with-0-duration honeypots"`). A flat single-commit history is explicitly called out in the spec as a red flag at Stage 4 manual review — real iteration must be visible.