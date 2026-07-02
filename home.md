# Build Prompt — Recruiter-X Homepage
**For: Antigravity**
**Source: The exact UI in the screenshot provided. Replicate it precisely — layout, sections, order, copy, colors. Do not invent new sections or reorder anything.**

---

## Backend pivot note (read first)

Supabase is gone. Auth and data now go through SQLAlchemy + FastAPI. The homepage itself is a public marketing page with zero database calls — it has no auth, no API calls, no dynamic data. Build it as a pure static Next.js page. The SQLAlchemy change only matters starting from the login page onward.

---

## Global design tokens (apply to every section)

```
Background:       #0A0A14  (deep navy-black)
Primary blue:     #0000FF  (electric blue — buttons, highlights, accents)
Text primary:     #FFFFFF
Text secondary:   #8888AA
Font heading:     "Space Grotesk" or "Syne" — the ALL CAPS bold display font in the hero
Font body:        "Inter"
Card background:  #111128  (slightly lighter than page bg)
Card border:      1px solid rgba(255,255,255,0.08)
Border radius:    12px cards, 6px buttons
```

---

## Section 1 — Navbar

- Left: "RECRUITER-X" wordmark in white, small caps
- Right: "Sign In" button — outlined, white border, white text, small, pill shape
- Background: transparent, sits over the hero
- Sticky on scroll

---

## Section 2 — Hero

Full viewport height. Dark navy background.

**Headline (large, ALL CAPS, bold display font):**
```
NEW ERA OF CANDIDATE
INTELLIGENCE
```

**Subline (small, body font, muted):**
```
Find the who actually suits the system and write for the
resume, rank and shortlist qualifing every candidate to parallel.
```

**Two pill badges below subline:**
- `Receive ≤ 35 days` (with a small icon)
- `Available 24 Days` (with a small icon)
Both are small outlined pills, white text, subtle border.

**Hero UI mockup (below the text, centered):**
A dark glassmorphic card showing a fake-but-realistic preview of the Recruiter-X analysis interface. Replicate what's in the screenshot exactly:
- Top bar with tabs: some navigation tabs
- Left panel: "JAMES" candidate label, analysis text block showing candidate requirements text, skills listed (Python, ML, Derivative markets, Scikit Learn etc.), a paragraph of description text
- Bottom bar: page indicator dots + a blue "Full Audit" button on the right

This mockup is a static image/illustration — not a real interactive component. Style it as a floating card with a subtle glow/shadow underneath.

---

## Section 3 — Stats strip

Four stats in a horizontal row, centered, on the dark background:

| Stat | Value | Label |
|------|-------|-------|
| 1 | **147** | Candidate intelligence metrics |
| 2 | **41%** | (label from screenshot — hiring/ATS related) |
| 3 | **7.4%** | (label from screenshot) |
| 4 | **3.x** | (label from screenshot) |

Large bold white numbers. Small muted label underneath each. Separated by subtle vertical dividers.

---

## Section 4 — Problem statement

Two-column layout.

**Left column:**
Small blue label tag at top: `THE PROBLEM`

**Heading:**
```
The hiring system rewards
resume writers, not capable
candidates.
```
Body text below (2 paragraphs — copy from screenshot exactly as shown).

**Right column — three problem cards stacked vertically:**

**Card 1: "Keyword Matching Theater"**
- Dark card, blue accent left border
- Body text: copy from screenshot
- Bottom: a stat/metric visual (blue bar or number)

**Card 2: "Inflation Goes Undetected"**
- Same card style
- Body text: copy from screenshot
- Bottom: a metric visual

**Card 3: "Ranking by Arrival, Not Fit"**
- Same card style
- Body text: copy from screenshot
- Bottom: a metric visual

---

## Section 5 — Seven layers feature list

Centered heading:
```
Seven layers of intelligence. One
ranked shortlist.
```

Two-column layout below:

**Left column — numbered feature list:**
Each item is a row with a number, feature name bold, and a short description below. Items 2 and 5 are highlighted (filled blue circle number, brighter text) — the others are muted/inactive looking. Exact items in exact order:

1. JD Audit
2. **Ghost Candidate** ← highlighted
3. Candidate Deep Analysis
4. Insider Signal Test
5. **Ghost Match Score** ← highlighted
6. Hybrid Ranker
7. Interrogation Engine

Short description text under each name (copy from screenshot).

**Right column — UI preview card:**
A dark card showing the "Ghost Candidate Profile" interface from the screenshot:
- Header: "Ghost Candidate Profile" with some tab controls
- Row items: "for Industry: Revenue · Platform · Staff Ops"
- Skill tags: pink/red pills ("Operational Design", "Staff Analytics", "Revenue Tracking")
- A percentage: **78%** match score prominent
- Small body text below

This is a static illustration card, not interactive.

---

## Section 6 — Feature cards grid

Centered heading:
```
Seven layers of candidate
analysis.
```

Small blue label above: `OUR NAMED FOUR`

**Grid: 2 columns × 3 rows = 6 cards** (matching the screenshot layout exactly)

**Card 1 — GHOST CANDIDATE BENCHMARK** (large card, spans or is taller)
- Dark card, blue header label
- Body: description text from screenshot
- Bottom: tag pills ("Senior", "Ghost Candidate employed", "Data Eng", "Output")
- Bottom right: "PR Merit +" label

**Card 2 — POOL HEALTH** (right column, top)
- Dark card
- Body: short description
- Visual: two metric rows with blue progress bars and percentages (7.4, 4.8 or similar from screenshot)

**Card 3 — INTERROGATION** (left column, middle — blue background card)
- Electric blue `#0000FF` background — this one stands out
- White text
- Body: description
- Bottom: a quote/output example showing interrogation question output

**Card 4 — JD AUDIT** (right column, middle — blue background)
- Electric blue background
- Label: "A thorough Analysis"
- Body: description text
- Shows audit output preview

**Card 5 — HYBRID RANKER** (left column, bottom — large blue card)
- Electric blue background
- Body: description
- Bottom right: "Interrogating Inventory" label
- Visual: horizontal score bars on the right side

**Card 6 — TRAJECTORY ANALYZER** (implied from screenshot — check exact layout)
- Dark card
- Body: description
- Score bars visual

All cards: `border-radius: 12px`, consistent padding, copy text exactly from the screenshot.

---

## Section 7 — FAQ

Centered heading:
```
Frequently Asked Questions
```

Small subline below: copy from screenshot.

**Accordion list — exact questions from screenshot:**
1. How is Recruiter-X different from an ATS?
2. Does Recruiter-X screen resumes?
3. Is Recruiter-X a GDPR compliant?
4. How does OTRA actually work? What does it cost?
5. How long does analysis take?

Each is a collapsed accordion row. Dark background, white question text, expand icon on right. On click, expands to show answer text. Only one open at a time.

**Below accordion:**
"Contact Support →" link in blue.

---

## Section 8 — Bottom CTA

Full-width section. Dark navy to blue gradient background (matches screenshot — deep blue glow effect).

**Heading (large, centered):**
```
The best candidate in your current
pile is probably not at the top of
it.
```

**Subline:**
```
Upload your JD, bring in the dataset, and get a ranked shortlist ready
in minutes. No setup. No training. Just drop in your data and see.
```

**CTA button:**
"Start Your First Analysis →" — white background, dark text, pill shape, centered.

On click: navigate to `/login`.

---

## Section 9 — Footer

Dark background. Two rows:

**Row 1 — 5 columns:**
- Col 1: "RECRUITER-X" wordmark + tagline
- Col 2: Product links (features, pricing, changelog, etc. — copy from screenshot)
- Col 3: Company links
- Col 4: Resources links
- Col 5: Legal links

**Row 2 — bottom bar:**
- Left: copyright
- Right: social icons

---

## What NOT to build

- No database calls on this page
- No auth checks on this page
- No API calls on this page
- No interactive charts or real data — all visuals are static illustrations
- No animations beyond basic CSS hover states and accordion expand/collapse
- The hero mockup and Ghost Candidate card are static decorative elements — not real components wired to the backend

---

## File to create

`src/app/page.tsx` — the homepage, exported as default. All section components can be colocated in `src/components/home/` (HeroSection, StatsStrip, ProblemSection, FeatureList, FeatureGrid, FAQSection, CTASection, Footer).

One commit when all sections are built and visually match the screenshot. Then a second commit after checking on mobile (the layout should stack to single column below 768px).