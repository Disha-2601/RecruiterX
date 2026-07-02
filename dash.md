# Dashboard Page — Full Specification
**For: Antigravity**
**File: `src/app/dashboard/page.tsx` and related components**
**No auth. No Supabase. Backend is FastAPI + SQLAlchemy locally.**

---

## ⚠️ Two bugs to fix first, before reading anything else

**Bug 1 — "View Details" button triggers analysis. It must not.**
Find every "View Details" button on this page. Change onClick to `router.push('/dashboard/results?project_id=${project.id}')`. No API call. No pipeline. No spinner. Just navigate.

**Bug 2 — "+ New Project" opens a popup. It must not.**
Find the "+ New Project" button in the navbar. Change onClick to `router.push('/project/new')`. Delete whatever modal it currently opens.

---

## What this page is

The dashboard is a read-only overview page. It never triggers computation. It never calls `rank.py`. It never calls `parse_jd.py`. It never calls `build_index.py`. Everything it shows is read from the SQLAlchemy database or from already-written files on disk. Its job is to show the user what has already been done and let them navigate to the right place.

---

## Section 1 — Navbar

**What it does:** global navigation. Present on every authenticated page.

**Left side:**
- Recruiter-X logo (dashed circle icon + "Recruiter-X" wordmark)
- "Local Dev Organization" label — static text, reads from no API, just hardcoded for local dev context

**Center:**
- "Dashboard" link — `router.push('/dashboard')` — active state when on this page

**Right side:**
- "+ New Project" button
  - Style: filled blue `#0000FF`, white text, pill shape, `+ New Project` label
  - **onClick: `router.push('/project/new')` — navigates, never opens a modal**
- Logout icon (arrow-out icon)
  - For local dev with no auth: this can simply clear any local Zustand state and `router.push('/')` back to homepage

**Input:** nothing from the database
**Output:** navigation only

---

## Section 2 — Hero card ("Pick up where you left off")

**What it does:** shows the most recently active project at a glance so the user can immediately continue where they stopped.

**How it fetches data:**
```
GET /api/projects/recent
```
Returns the single most recent project row from SQLAlchemy:
```json
{
  "id": 1,
  "name": "Senior AI/ML Engineer Search",
  "role_title": "Senior AI/ML Engineer",
  "department": "Engineering",
  "latest_run_id": "abc123",
  "latest_run_status": "complete",
  "candidate_count": 100
}
```

**What it displays:**
- Small blue label above: `PICK UP WHERE YOU LEFT OFF`
- Project name as large heading: `Senior AI/ML Engineer Search`
- Status badge next to heading: reads `latest_run_status` from the API response
  - `complete` → green badge: `✓ COMPLETE`
  - `ranking` → blue animated badge: `⚡ ANALYZING`
  - `failed` → red badge: `✗ FAILED`
  - `queued` or `indexing` → blue badge: `⚡ ANALYZING`
  - **The badge is a display of database status. It never triggers anything.**
- Below heading: `Target Role: [role_title] • [department]`
- Below that (blue text): `Live: [candidate_count] of [candidate_count] candidates analyzed` — reads from `candidate_count` in the response
- Right side: "View Details ▶" button
  - Style: filled blue `#0000FF`, white text, rounded pill
  - **onClick: `router.push('/dashboard/results?project_id=${project.id}')` — navigates to results page, triggers zero computation**

**If no projects exist yet:** hide this card entirely, show nothing in its place (the stats strip and project grid below handle the empty state).

**Input:** `GET /api/projects/recent` → one project row
**Output:** navigation to results page on button click

---

## Section 3 — Stats strip

**What it does:** shows four real aggregate numbers about the current workspace. All four are computed by the backend from real database rows — never hardcoded, never fake.

**How it fetches data:**
```
GET /api/stats
```
Returns:
```json
{
  "total_candidates": 100,
  "avg_qualification_score": 0.02,
  "active_runs": 1,
  "api_key_status": "missing"
}
```

**What it displays (four columns, separated by vertical dividers):**

| Column | Value source | Display |
|--------|-------------|---------|
| Total Candidates | `total_candidates` | Large number e.g. `100`, label `TOTAL CANDIDATES` |
| Avg Qualification | `avg_qualification_score * 100` | Percentage e.g. `2%`, label `AVG QUALIFICATION` |
| Active Runs | `active_runs` | Number e.g. `1`, label `ACTIVE RUNS` |
| AI API Key Status | `api_key_status` | If `"missing"`: orange `⚙ Missing` text + label `AI API KEY STATUS`. If `"ok"`: green `✓ Connected` |

**`avg_qualification_score`** = average `score` across all `ranking_results` rows in the database for completed runs. This is a real SQL aggregate: `SELECT AVG(score) FROM ranking_results WHERE run_id IN (SELECT id FROM ranking_runs WHERE status = 'complete')`.

**`active_runs`** = count of `ranking_runs` rows where `status IN ('queued', 'parsing_jd', 'embedding', 'ranking')`.

**`api_key_status`** — for local dev, this can always return `"missing"` since there's no API key management. Do not remove this stat — it's part of the visual.

**Input:** `GET /api/stats` → four numbers
**Output:** display only, no interactions

---

## Section 4 — Workspace Projects

**What it does:** shows all projects for this workspace as filterable, searchable cards. This is the main content area of the dashboard.

### 4A — Section header

Static text: `Workspace Projects` — Space Grotesk, 24px, `--text-primary`.

### 4B — Filter tabs

Five tabs: `All [count]`, `Analyzing [count]`, `Complete [count]`, `Archived [count]`

**How it fetches counts:**
```
GET /api/projects?status=all
```
Returns all project rows. Frontend computes tab counts client-side from the returned array. No separate count API call.

Active tab: filled blue `#0000FF` pill, white text.
Inactive tab: gray outlined pill.

Clicking a tab filters the displayed project cards client-side — no new API call per tab click, since all projects are already loaded.

### 4C — Search + Sort

**Search input:**
- Placeholder: `Search project or role...`
- Filters the project cards client-side on `name` and `role_title` fields as user types
- No debounced API call — filtering is purely client-side on the already-loaded array

**Sort dropdown:**
- Options: `Most Recent`, `Oldest`, `A–Z`, `Z–A`
- Sorts the displayed cards client-side on `created_at` or `name` — no API call

**Input:** local state only
**Output:** filtered/sorted view of already-loaded project array

### 4D — Project cards grid

**How it fetches data:**
```
GET /api/projects
```
Returns array of all project rows:
```json
[
  {
    "id": 1,
    "name": "Senior AI/ML Engineer Search",
    "role_title": "Senior AI/ML Engineer",
    "candidate_count": 100,
    "latest_run_status": "complete",
    "latest_run_id": "abc123",
    "created_at": "2026-06-29T12:00:00Z"
  }
]
```

**Each project card shows:**
- Project name: bold white text (card is blue `#0000FF` background when active/analyzing, white background when complete or draft)
- Role title below name: smaller muted text
- `Candidate pool size: [candidate_count]`
- Status badge in top right: same badge logic as Section 2 hero card — reads `latest_run_status`

**Card background by status:**
- `complete`: white card, `--border-default`, `--shadow-card`
- `ranking` / `queued` / `analyzing`: blue `#0000FF` card, white text (like in the screenshot)
- `failed`: white card with red left border accent
- no run yet (draft): white card, dashed border

**Card onClick:**
- If `latest_run_status = 'complete'`: `router.push('/dashboard/results?project_id=${project.id}')`
- If `latest_run_status` is active (ranking/queued): `router.push('/dashboard/results?project_id=${project.id}')` — results page handles the "run in progress" state with polling
- If no run yet (draft): `router.push('/project/${project.id}?phase=1')` — sends them back into the wizard

**"View Details" button on each card:**
- Same as card onClick — `router.push('/dashboard/results?project_id=${project.id}')`
- **Never triggers analysis. Never calls any compute API.**

**Empty state (no projects at all):**
Show a centered card:
```
No projects yet.
Create your first project to start ranking candidates.

[ + New Project ]  ← navigates to /project/new
```

**Input:** `GET /api/projects` → array of project rows
**Output:** navigation to results page or wizard on click

---

## Section 5 — Results page (`/dashboard/results?project_id=:id`)

This is where "View Details" navigates to. It is a separate page but described here because it's the destination of every "View Details" click on this dashboard.

**What it does:** displays the ranked output of a completed run for a specific project. Reads only from the database. Computes nothing.

**How it fetches data:**
```
GET /api/results?project_id=:id
```
Returns:
```json
{
  "project": { "id": 1, "name": "Senior AI/ML Engineer Search", "role_title": "..." },
  "run": { "id": "abc123", "status": "complete", "runtime_seconds": 28.4, "pipeline_mode": "rank_only", "completed_at": "..." },
  "results": [
    {
      "candidate_id": "CAND_0037944",
      "rank": 1,
      "score": 0.70440123,
      "reasoning": "Senior Data Scientist with 4.9 yrs...",
      "anonymized_name": "Suresh Singh",
      "current_title": "Senior Data Scientist",
      "current_company": "Vedantu",
      "years_of_experience": 4.9,
      "location": "Jaipur, Rajasthan",
      "notice_period_days": 30,
      "preferred_work_mode": "flexible",
      "skill_match": 0.6456,
      "experience_fit": 0.8481,
      "behavioral": 0.5326,
      "education": 1.0,
      "logistics_fit": 0.68,
      "consistency_penalty": 0.0,
      "has_expert_low_duration": false,
      "has_yoe_mismatch": false,
      "has_overlap": false,
      "has_assessment_mismatch": false,
      "has_suspicious_uniformity": false
    }
    // ... 99 more
  ]
}
```

**What it displays:**

**Run metadata bar (top):**
- Project name + role title
- `Pipeline: Ranking only` / `Re-embedding JD` — from `run.pipeline_mode`
- `Runtime: 28.4 seconds` — from `run.runtime_seconds`
- `100 candidates ranked` — from `results.length`
- `Completed: [formatted date]` — from `run.completed_at`

**Ranked table (main content):**

| Column | Field | Format |
|--------|-------|--------|
| Rank | `rank` | `#1` through `#100` |
| Candidate | `anonymized_name` | Text |
| Title | `current_title` | Text |
| Company | `current_company` | Text |
| Experience | `years_of_experience` | `4.9 yrs` |
| Score | `score` | `0.7044` (4 decimal places) |
| Reasoning | `reasoning` | Full sentence, truncated with expand |

Each row is expandable on click. Expanded state shows:

**Feature breakdown (blue gradient bars using `--gradient-score`):**

| Dimension | Field | Weight label |
|-----------|-------|-------------|
| Skill Match | `skill_match` | 40% |
| Experience Fit | `experience_fit` | 25% |
| Behavioral | `behavioral` | 20% |
| Education | `education` | 8% |
| Logistics Fit | `logistics_fit` | 7% |
| Consistency Penalty | `consistency_penalty` | Multiplicative — red bar |

**Consistency flags (only shown when `true`):**

| Field | Message |
|-------|---------|
| `has_expert_low_duration` | `⚠ Claims expert proficiency with very low usage duration` |
| `has_yoe_mismatch` | `⚠ Stated years of experience doesn't match career history sum` |
| `has_overlap` | `⚠ Overlapping employment date ranges detected` |
| `has_assessment_mismatch` | `⚠ Claimed skill level mismatches platform test score` |
| `has_suspicious_uniformity` | `⚠ Suspiciously uniform expert proficiency across all skills` |

If all five are `false`: show `✓ No consistency flags` in green.

**Additional candidate info in expanded row:**
- Location: `location`
- Notice period: `notice_period_days` days
- Work mode: `preferred_work_mode`

**Export button (top right of results page):**
- Label: `Download CSV`
- Style: black pill button
- onClick: `GET /api/export?project_id=:id` → downloads `submission.csv` that `rank.py` already wrote to disk
- This button never re-runs rank.py. It serves an already-written file.

**If run status is not complete yet (still ranking):**
Show a polling state instead of the table:
```
⚙  Ranking in progress...
Elapsed: 00:14

[ Stage rows showing real pipeline_mode steps ]
```
Poll `GET /api/runs/:run_id/status` every 2 seconds. When status becomes `complete`, reload the results automatically.

**If run failed:**
Show the real `run.error_message` and a "Try Again" button that navigates back to `/project/:id?phase=2`.

**Input:** `GET /api/results?project_id=:id` → project + run metadata + 100 result rows
**Output:** export CSV download on button click, navigation on Try Again

---

## API summary — everything this page and its results page calls

| Endpoint | Method | Called by | Returns |
|----------|--------|-----------|---------|
| `/api/projects/recent` | GET | Hero card | Most recent project row |
| `/api/stats` | GET | Stats strip | 4 aggregate numbers |
| `/api/projects` | GET | Project cards grid | All project rows |
| `/api/results?project_id=:id` | GET | Results page | Project + run + 100 result rows |
| `/api/runs/:id/status` | GET | Results page polling | Run status + pipeline_mode |
| `/api/export?project_id=:id` | GET | Export button | `submission.csv` file download |

**Zero of these endpoints trigger any computation. They all read from the database or from already-written files on disk.**

---

## Hard rules — these apply to every section above

- No section on the dashboard page calls `rank.py`, `parse_jd.py`, `embed_jd.py`, or `build_index.py`. If any button on this page triggers a compute script, that is a bug.
- Every number displayed is read from the database. Nothing is computed client-side from raw candidate data.
- Status badges read `latest_run_status` or `run.status` from the database. They never infer status from anything else.
- "View Details" and card clicks navigate. They never compute.
- "+ New Project" navigates to `/project/new`. It never opens a modal.
- Export downloads an already-written file. It never re-runs ranking.
- Empty states are real empty states from real database queries returning zero rows — never hidden by defaulting to sample data.