# Build Prompt — Project Wizard Page (`/project/new` and `/project/[id]`)
**For: Antigravity**
**No auth. No Supabase. Backend is FastAPI + SQLAlchemy running locally.**

---

## ⚠️ CRITICAL — READ THIS BEFORE WRITING A SINGLE LINE OF CODE

These rules are non-negotiable. They override any default behavior, any assumption, and any shortcut Antigravity might take. Violating any one of them produces a broken, dishonest submission.

### Rule 1 — `build_index.py` is NEVER called. Ever. By anything.

`build_index.py` is a one-time offline script that has already been run. Its outputs sit in `cache/` as permanent read-only files. This app never calls it, never imports it, never triggers it, never references it in any code path — not in the wizard, not in the backend, not in the dashboard. If any file in this codebase calls `build_index.py`, that is a bug. Delete it.

The cache files are:
```
cache/skill_embeddings.npy          ← read-only, 100K × 384
cache/career_embeddings.npy         ← read-only, 100K × 384
cache/candidate_features.parquet    ← read-only, 100K rows
cache/candidate_ids.npy             ← read-only, 100K IDs
cache/jd_skill_embedding.npy        ← read-only (replaced only when new JD uploaded)
cache/jd_career_embedding.npy       ← read-only (replaced only when new JD uploaded)
cache/jd_requirements.json          ← read-only (replaced only when new JD uploaded)
```

### Rule 2 — The three pipeline modes. Learn them. Implement exactly these. Nothing else.

**Mode A: Both demo ticks ON (jd_is_demo = true AND candidates_is_demo = true)**
→ Call `rank.py` only.
→ `rank.py` loads all cache files directly from disk. No parsing. No embedding. No indexing.
→ Must finish and write results in under 3 minutes.
→ This is the fast path judges will use most. It must work flawlessly.

**Mode B: New JD uploaded, demo candidates tick ON (jd_is_demo = false, candidates_is_demo = true)**
→ Call `parse_jd.py` on the new JD → show parsed result on screen → user confirms → call `embed_jd.py` → call `rank.py`.
→ `embed_jd.py` uses MiniLM model weights already on disk. Zero network calls.
→ Candidate cache files are never touched. Only the JD embeddings are replaced.
→ Must finish in under 45 seconds after user confirms.

**Mode C: New JD uploaded, new candidates uploaded (jd_is_demo = false, candidates_is_demo = false)**
→ Show the honest info card explaining offline indexing is required.
→ Offer the user to fall back to the demo candidate pool (Mode B).
→ Never attempt to run `build_index.py`. Never silently use the new candidate file for ranking.

There is no Mode D. There is no other pipeline. If something isn't covered by A, B, or C — it falls back to the demo pool with an honest explanation.

### Rule 3 — Parse JD first, show result, then ask for candidates. Always.

When a new JD is uploaded (or typed), the app must:
1. Run `parse_jd.py` immediately
2. Display the full Parsed Requirements Card on screen (skills, years, salary, locations, quality score)
3. Wait for the user to read it and click Continue
4. Only then move to Phase 2 to ask for candidate data

This order is mandatory. Phase 2 never unlocks before the parsed JD result is shown and confirmed. Even if the demo JD tick is on, the parsed card still renders (populated from `cache/jd_requirements.json`) before Phase 2 opens.

### Rule 4 — The dashboard reads from the database. It never recomputes anything.

When `rank.py` completes, it writes 100 result rows into the `ranking_results` table in SQLAlchemy. The dashboard reads those rows. That's the only thing the dashboard does with data. It does not call `rank.py`. It does not read `.npy` files. It does not read `.parquet` files. It does not recalculate scores. Every number on screen — rank, score, skill_match, experience_fit, behavioral, consistency_penalty, flags — comes directly from the `ranking_results` table rows that `rank.py` already wrote.

The dashboard shows:
- Ranked table: `rank`, `candidate_id`, `score`, `reasoning` — from `ranking_results`
- Per-candidate expandable breakdown: `skill_match`, `experience_fit`, `behavioral`, `consistency_penalty`, all five boolean flags — from `ranking_results`
- Export button: downloads `submission.csv` which `rank.py` already wrote to disk

Nothing on the dashboard page triggers any computation. If there are no results yet, show an honest empty state and link back to the project wizard. Never show stale data, demo data, or placeholder numbers.

### Rule 5 — No fake data. No fake progress. No fake buttons. Anywhere.

Every button calls a real API. Every progress indicator reads real backend status. Every number came from a real pipeline run. If something cannot be built for real, it does not appear in the UI at all.

---

## Color tokens (from design system V2.0 — apply exactly, no improvising)

```css
--bg-base:              #FFFFFF   /* page background, all card surfaces */
--bg-subtle:            #FAFAFA   /* alternate section backgrounds */
--bg-muted:             #F5F5F5   /* input backgrounds, disabled fills */

--color-blue:           #0000FF   /* primary blue — active states, links, focus rings */
--color-blue-mid:       #2563EB   /* hover states, secondary CTAs */
--color-blue-pale:      #EEF2FF   /* tinted info surfaces, hover fills */
--gradient-hero:        linear-gradient(135deg, #000033 0%, #0000FF 40%, #2563EB 70%, #8FB3FF 100%)
--gradient-score:       linear-gradient(90deg, #0000FF, #2563EB, #8FB3FF)

--color-black:          #0A0A0A   /* pill buttons, strong headings, dark card backgrounds */
--color-black-soft:     #111111   /* dark feature cards */

--glass-bg:             rgba(255,255,255,0.60)
--glass-border:         rgba(255,255,255,0.20)
--glass-blur:           blur(20px)

--text-primary:         #0A0A0A
--text-secondary:       #4A4A4A
--text-tertiary:        #8C8C8C
--text-on-dark:         #FFFFFF
--text-on-blue:         #FFFFFF

--color-success:        #16A34A
--color-success-bg:     #F0FDF4
--color-danger:         #DC2626
--color-danger-bg:      #FEF2F2
--color-warning:        #D97706
--color-info-bg:        #EEF2FF

--border-default:       1px solid #E5E7EB
--border-subtle:        1px solid #F0F0F0
--shadow-card:          0 4px 16px rgba(0,0,34,0.06)
--shadow-card-hover:    0 12px 32px rgba(0,0,34,0.10)
--shadow-float:         0 20px 48px rgba(0,0,34,0.12)
--shadow-glow-blue:     0 0 60px rgba(0,0,255,0.15)
```

**Three rules that override everything else:**
- White (`#FFFFFF` / `#FAFAFA`) is the canvas. Every card, every phase card, every section body — white background.
- Blue is used for gradient hero moments, CTA band, score fills, active states, focus rings, and the JD upload zone only. Not for page backgrounds.
- Black (`#0A0A0A`) is for pill buttons and deliberate dark punctuation cards only.

---

## Page layout

Page background: `--bg-subtle` (`#FAFAFA`).

Centered content column, max-width `680px`, horizontally centered, `padding: 48px 24px`.

**Top of page — Step indicator:**

Three steps, horizontal, centered above the phase card:

```
  ①  Project Name  ———  ②  Job Description  ———  ③  Candidates & Run
```

Active step: filled `--color-blue` circle, `--text-primary` bold label.
Completed step: `--color-success` checkmark circle, `--text-tertiary` label.
Inactive step: `--bg-muted` empty circle, `--text-tertiary` label.
Connector lines between steps: `--border-subtle` when inactive, `--color-blue` when step is complete.

Below the step indicator: the current phase card. One card visible at a time.

---

## Phase 0 — Project Name

**Card:**
- Background: `--bg-base` (`#FFFFFF`)
- Border: `--border-default`
- Border-radius: `16px`
- Shadow: `--shadow-card`
- Padding: `40px`

**Card heading:**
```
What role are you hiring for?
```
Font: Space Grotesk, 24px, `--text-primary`, semibold.

**Subline:**
```
Give this project a name so you can find it later.
```
Font: Inter, 14px, `--text-secondary`.

**Input field:**
- Background: `--bg-base`
- Border: `1px solid #E5E7EB`
- Border-radius: `8px`
- Padding: `14px 16px`
- Font: Inter, 15px, `--text-primary`
- Placeholder: `e.g. Senior ML Engineer — Bangalore` in `--text-tertiary`
- On focus: border changes to `2px solid --color-blue`, no outline
- Full width

**Continue button (bottom right of card):**
- Background: `--color-black` (`#0A0A0A`) — black pill button per design system
- Text: `--text-on-dark`, Inter, 14px, medium weight
- Label: `Continue →`
- Border-radius: `999px`
- Padding: `12px 28px`
- Disabled state: background `--bg-muted`, text `--text-tertiary`, cursor not-allowed
- Disabled until input has ≥ 3 characters
- On click: `POST /api/projects` with `{ name: inputValue }` → navigate to `/project/:id?phase=1`

---

## Phase 1 — Job Description

**Card:**
Same white card style as Phase 0 — `--bg-base`, `--border-default`, `--shadow-card`, `16px` radius, `40px` padding.

**Card heading:**
```
Add your Job Description
```
Space Grotesk, 24px, `--text-primary`, semibold.

**Subline:**
```
We'll extract skills, experience range, location, and salary —
and show you exactly what we found before moving on.
```
Inter, 14px, `--text-secondary`.

---

### Tab toggle (Upload JD / Write JD)

Pill toggle, sits below the subline, left-aligned.

Active tab: background `--color-black`, text `--text-on-dark`, border-radius `999px`.
Inactive tab: background transparent, text `--text-secondary`, no border.
Container: `--bg-muted` pill background, `border-radius: 999px`, padding `4px`.

---

### Tab 1: Upload JD (default)

**Upload zone:**
- Background: `--color-blue` (`#0000FF`) — the upload box is solid electric blue. This is one of the deliberate blue moments per the design system.
- Border: `2px dashed rgba(255,255,255,0.5)`
- Border-radius: `12px`
- Padding: `48px 32px`
- Icon: white upload arrow, centered, 32px
- Primary text: `Drop your JD here` — `--text-on-blue`, Space Grotesk, 18px, semibold
- Secondary text: `or click to browse` — `rgba(255,255,255,0.7)`, Inter, 14px
- Format hint at bottom: `.md  .docx  .pdf  .txt` — `rgba(255,255,255,0.5)`, Inter, 12px
- Entire zone is a clickable file input
- Hover state: background `#1A1AFF` (slightly lighter blue), cursor pointer

**On file selected:**
- Zone shows: file name + size, replacing drop text
- Pulsing white spinner in the center
- Text: `Analyzing JD...` in white

**On parse success:** hide upload zone entirely, show Parsed Requirements Card.

**On parse error:** show real error message inside the zone, white text on red-tinted overlay (`rgba(220,38,38,0.15)`), keep zone visible for retry.

---

### Tab 2: Write JD

**Textarea:**
- Background: `--bg-base` (`#FFFFFF`)
- Border: `2px solid --color-blue` (`#0000FF`)
- Border-radius: `12px`
- Padding: `16px`
- Text color: `--color-blue` (`#0000FF`) — blue text on white, exact opposite of the upload tab
- Placeholder: `Paste or write the full job description here...` in `rgba(0,0,255,0.3)`
- Font: Inter, 14px
- Min height: `240px`, vertically resizable only

**Analyze button (below textarea, right-aligned):**
- Style: outlined — border `1.5px solid --color-blue`, text `--color-blue`, background transparent
- Border-radius: `999px`
- Padding: `10px 24px`
- Label: `Analyze JD →`
- Hover: background `--color-blue-pale`
- Disabled until textarea > 50 characters
- On click: `POST /api/parse-jd` with `{ jd_text: value }`, button shows `Analyzing...` with spinner

**On success:** hide textarea + button, show Parsed Requirements Card.

---

### Demo tick

Sits below the tab toggle and upload/write area, separated by a thin `--border-subtle` divider.

```
☐  Use the demo JD (Redrob Senior AI/ML Engineer role)
```

Custom checkbox: unchecked = `--border-default` outlined square. Checked = `--color-blue` filled square with white checkmark.
Label: Inter, 14px, `--text-secondary`.

**When checked:**
- Hide upload zone and textarea
- `GET /api/parse-jd/demo` — backend reads `cache/jd_requirements.json` from disk, returns it
- Show Parsed Requirements Card immediately with that data
- Small line below checkbox: `✓  Using precomputed JD requirements` in `--color-success`, 13px

**When unchecked:** show upload/write tabs again, clear parsed card.

---

### Parsed Requirements Card

**Shown after every successful parse — whether file upload, typed text, or demo tick. Always. No exceptions.**

Card sits below the upload/write area within the same phase card. Separated by a `--border-subtle` horizontal divider above it.

**Card surface:** background `--color-blue-pale` (`#EEF2FF`), border `1px solid rgba(0,0,255,0.12)`, border-radius `12px`, padding `24px`.

**Header row:**
- Left: `JD Analysis Complete` — Space Grotesk, 16px, `--text-primary`, semibold
- Right: `Quality Score: 95/100` — small pill, background `--color-success-bg`, text `--color-success`, border-radius `999px`, 12px font

**Must-have skills section:**
- Label: `Must-have skills` — Inter, 12px, `--text-tertiary`, uppercase, letter-spacing 0.05em
- Below: pill row. Each pill: background `--color-blue`, text `--text-on-blue`, border-radius `999px`, padding `4px 12px`, Inter 13px. Show skill name + weight: `Python 1.0`, `RAG 0.9`, `Vector DBs 0.8`

**Nice-to-have skills section:**
- Label: `Nice-to-have` — same muted label style
- Below: pill row. Each pill: background transparent, border `1px solid #E5E7EB`, text `--text-secondary`, same sizing

**Info grid (2 columns):**
Each row: left label in `--text-tertiary` 12px, right value in `--text-primary` 14px semibold.

| Label | Value |
|-------|-------|
| Experience | `5 – 9 years` |
| Work mode | `Hybrid` |
| Locations | `Pune · Noida · Hyderabad · Mumbai` |
| Salary | `₹18L – ₹35L` or `Not stated` |
| Seniority | `Senior` |
| Notice period | `30 days preferred` |

**Audit narrative:**
Inter, 13px, `--text-secondary`, below the grid. The real `audit_narrative` string from parse_jd output.

**Edit link (bottom left):**
`← Use a different JD` — `--color-blue`, Inter, 13px, no underline by default, underline on hover. Clicking clears the parsed card and shows the upload/write tabs again.

---

### Continue button (Phase 1)

Appears only after Parsed Requirements Card is showing. Same black pill button style as Phase 0.
Label: `Continue →`
On click: `PATCH /api/projects/:id` with `{ jd_is_demo, jd_parsed }` → navigate to `/project/:id?phase=2`

---

## Phase 2 — Candidates and Run

**Card:** same white card style — `--bg-base`, `--border-default`, `--shadow-card`, `16px` radius, `40px` padding.

**Card heading:**
```
Add your candidate pool
```
Space Grotesk, 24px, `--text-primary`, semibold.

**Subline:**
```
Upload a candidate dataset or use the precomputed 100K Redrob pool.
```
Inter, 14px, `--text-secondary`.

---

### Demo tick (top of card, prominent)

```
☐  Use the demo candidate pool (100,000 Redrob candidates — precomputed)
```

Same custom checkbox style. When checked:
- Info row below: `✓  100,000 candidates loaded — precomputed index ready` in `--color-success`, 13px
- Hide upload zone

---

### Upload zone (shown when demo tick is OFF)

Same blue upload box as Phase 1 upload tab — `--color-blue` background, white dashed border, white text.
Accepts: `.jsonl`, `.jsonl.gz`

On file selected: `POST /api/validate-candidates` → on valid, show inside zone: `✓ 100,000 candidates loaded, schema valid` in white with a checkmark icon. On invalid: real error in white on red-tinted overlay.

**Honest info card (shown immediately after any file upload, valid or not):**

Card: background `--color-info-bg` (`#EEF2FF`), border `1px solid rgba(37,99,235,0.2)`, border-radius `12px`, padding `20px 24px`.

```
ℹ  Custom Candidate Pool Received

Your file has been received. Processing a new candidate pool
requires an offline embedding + indexing step (~20–30 min for
100K candidates) that runs outside this app.

For this session, ranking will run against the precomputed
100K Redrob dataset.
```

Text: Inter, 14px, `--text-secondary`. Icon `ℹ` in `--color-blue`.

Button at bottom of this card: `Continue with demo pool` — black pill button. Clicking sets `candidates_is_demo = true` and checks the demo tick above.

---

### Pipeline preview panel

Shown once both Phase 1 and Phase 2 are complete.

Card: `--bg-base`, `--border-default`, `--shadow-card`, `16px` radius, `24px` padding. Blue left border accent: `3px solid --color-blue` on the left edge of the card.

Header: `Pipeline Configuration` — Inter, 12px, `--text-tertiary`, uppercase, letter-spacing 0.08em.

Three rows:

**Row 1 — Ranking only (~30 sec)**
Active when both demo ticks are on.
Active style: `--text-primary` semibold, `✅` icon, description in `--text-secondary` 13px.
Inactive style: everything in `--text-tertiary`, reduced opacity.

```
✅  Ranking only  (~30 sec)
    rank.py loads precomputed cache directly
```

**Row 2 — Re-embedding JD (~45 sec)**
Active when new JD was uploaded.

```
⚡  Re-embedding JD  (~45 sec)
    parse_jd.py → embed_jd.py → rank.py
```

**Row 3 — Full re-indexing (offline only)**
Always muted, always locked. Never active.

```
🔒  Full re-indexing  (offline only)
    New candidate pools require offline indexing.
    This runs outside the app.
```

Row separators: `--border-subtle`.

---

### Run button

Full width, large, sits below the pipeline preview panel.

**Disabled state:**
- Background: `--bg-muted`
- Text: `--text-tertiary`
- Label: `Complete the steps above to run`
- Border-radius: `12px`
- Not a pill — a wider rounded rectangle at this size

**Enabled state:**
- Background: `--gradient-hero` (`linear-gradient(135deg, #000033 0%, #0000FF 40%, #2563EB 70%, #8FB3FF 100%)`)
- Text: `--text-on-blue`, Space Grotesk, 16px, semibold
- Label: `▶  Run Pipeline`
- Border-radius: `12px`
- Box shadow: `--shadow-glow-blue` (`0 0 60px rgba(0,0,255,0.15)`)
- Hover: slight brightness increase, shadow intensifies

**On click:** button immediately changes to `Running...` with white spinner, disabled.
`POST /api/runs` with `{ project_id, skip_embed: bool }` → returns `{ run_id }`.

---

### Execution state panel (replaces pipeline preview after Run is clicked)

Card: `--bg-base`, `--border-default`, `--shadow-card`, `16px` radius, `24px` padding.

**During run:**

Header row: `⚙  Pipeline Running` — `--text-primary`, Space Grotesk, 16px, semibold. Right side: elapsed timer `00:12` in `--text-tertiary` monospace, counting up every second via `setInterval`.

Stage rows (only show stages that actually ran — read from real `pipeline_mode`):

```
●  Parsing JD              ✓  2 sec        ← only if pipeline_mode includes parse
●  Embedding JD            ✓  4 sec        ← only if pipeline_mode includes embed
●  Ranking 100,000 candidates...  [spinner] ← always
```

Completed stage: `--color-success` checkmark, `--text-secondary` label, real elapsed time in `--text-tertiary`.
Active stage: `--color-blue` animated spinner dot, `--text-primary` label.
Pending stage: `--text-tertiary` bullet, `--text-tertiary` label.

Frontend polls `GET /api/runs/:id/status` every 2 seconds. Each real status change from the backend updates the rows.

---

**On `status = complete`:**

Card switches to:

Background: `--color-success-bg` (`#F0FDF4`), border `1px solid rgba(22,163,74,0.2)`.

```
✅  Ranking Complete

100 candidates scored and ranked.
Total time: 28 seconds
```

Text: Space Grotesk 18px `--text-primary` for heading, Inter 14px `--text-secondary` for body.

Button: `View Results →` — black pill button (`--color-black` background, `--text-on-dark`), centered.
On click: navigate to `/dashboard?run_id=:id`.

---

**On `status = failed`:**

Card background: `--color-danger-bg` (`#FEF2F2`), border `1px solid rgba(220,38,38,0.2)`.

```
❌  Pipeline Failed

[real error_message string from backend here — never a generic message]
```

Button: `Try Again` — outlined, border `1.5px solid --color-danger`, text `--color-danger`, background transparent, pill shape.
On click: clears execution panel, re-enables Run button.

---

## API calls this page makes

| When | Endpoint | Body |
|------|----------|------|
| Phase 0 Continue | `POST /api/projects` | `{ name: string }` |
| Phase 1 file upload | `POST /api/parse-jd` | `FormData` with file |
| Phase 1 write JD | `POST /api/parse-jd` | `{ jd_text: string }` |
| Phase 1 demo tick | `GET /api/parse-jd/demo` | none |
| Phase 1 Continue | `PATCH /api/projects/:id` | `{ jd_is_demo, jd_parsed }` |
| Phase 2 file upload | `POST /api/validate-candidates` | `FormData` with file |
| Phase 2 Run | `POST /api/runs` | `{ project_id, skip_embed }` |
| Phase 2 polling | `GET /api/runs/:id/status` | none — every 2 seconds |

---

## Zustand store

```typescript
{
  projectId: number | null
  projectName: string
  phase: 0 | 1 | 2
  jdIsDemo: boolean
  jdParsed: ParsedJD | null
  candidatesIsDemo: boolean
  runId: string | null
  runStatus: 'idle' | 'queued' | 'parsing_jd' | 'embedding' | 'ranking' | 'complete' | 'failed'
  runError: string | null
  elapsedSeconds: number
}
```

---

## Hard rules

- Parsed Requirements Card renders after every successful parse — upload, type, or demo tick. Never skipped.
- Run button calls a real API. Never sets `runStatus = complete` locally.
- Polling reads real `/api/runs/:id/status` every 2 seconds. Never a timer simulating progress.
- Stage rows in the execution panel appear only for stages that actually ran — read from real `pipeline_mode`.
- Honest info card always shows when a file is uploaded to the candidate zone. Never skipped.
- No step auto-advances without a real API success response.
- The Run button's gradient background is `--gradient-hero` — the blue gradient moment on this page.

---

## Files to create

```
src/app/project/new/page.tsx
src/app/project/[id]/page.tsx
src/components/project/StepIndicator.tsx
src/components/project/Phase0Name.tsx
src/components/project/Phase1JD.tsx
src/components/project/JDUploadTab.tsx
src/components/project/JDWriteTab.tsx
src/components/project/ParsedRequirementsCard.tsx
src/components/project/Phase2Candidates.tsx
src/components/project/PipelinePreview.tsx
src/components/project/PipelineRunner.tsx
src/stores/useProjectStore.ts
```

Commit after Phase 0 works end-to-end.
Commit after Phase 1 works end-to-end (all three paths).
Commit after Phase 2 works end-to-end including real polling and completion.