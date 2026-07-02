import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function POST(req: Request) {
  try {
    const { project_id, skip_embed } = await req.json();

    if (!project_id) {
      return NextResponse.json({ error: 'Missing project_id' }, { status: 400 });
    }

    const runId = `run_${Date.now()}`;
    const workDir = path.join(process.cwd(), 'redrob-ranker');
    const cacheDir = path.join(workDir, 'cache');
    const runsDir = path.join(cacheDir, 'runs');

    if (!fs.existsSync(runsDir)) {
      fs.mkdirSync(runsDir, { recursive: true });
    }

    const runStatusPath = path.join(runsDir, `${runId}.json`);

    // Initial status
    const initialStatus = {
      id: runId,
      project_id,
      status: 'queued',
      pipeline_mode: skip_embed ? 'ranking_only' : 'embed_and_rank',
      error_message: null,
      elapsed_seconds: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    fs.writeFileSync(runStatusPath, JSON.stringify(initialStatus, null, 2));

    // Start background process
    runPipelineInBackground(runId, project_id, skip_embed, workDir, runStatusPath);

    return NextResponse.json({ run_id: runId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function runPipelineInBackground(
  runId: string,
  projectId: string,
  skipEmbed: boolean,
  workDir: string,
  runStatusPath: string
) {
  const startedAt = Date.now();
  const cacheDir = path.join(workDir, 'cache');
  const updateStatus = (status: string, extra = {}) => {
    try {
      const current = JSON.parse(fs.readFileSync(runStatusPath, 'utf-8'));
      const elapsed = Math.round((Date.now() - startedAt) / 1000);
      fs.writeFileSync(
        runStatusPath,
        JSON.stringify(
          {
            ...current,
            status,
            elapsed_seconds: elapsed,
            updated_at: new Date().toISOString(),
            ...extra
          },
          null,
          2
        )
      );
    } catch (e) {
      console.error('Failed to write status:', e);
    }
  };

  try {
    const pythonExe = path.join(workDir, '.venv', 'Scripts', 'python.exe');
    if (!fs.existsSync(pythonExe)) {
      throw new Error(`Python interpreter not found at ${pythonExe}`);
    }

    // 1. Update project status in FastAPI DB to 'auditing'
    const putRes = await fetch(`http://127.0.0.1:8000/api/v1/db/projects?filters=[{"column":"id","value":"${projectId}"}]`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'auditing' })
    });
    if (!putRes.ok) {
      console.warn(`Warning: Failed to update project status to auditing (HTTP ${putRes.status})`);
    }

    // 2. Run Embedding if not skipped
    if (!skipEmbed) {
      updateStatus('embedding');
      const embedCmd = `"${pythonExe}" embed_jd.py`;
      await execPromise(embedCmd, { cwd: workDir });
    }

    // 3. Run Ranking
    updateStatus('ranking');
    const candidatesPath = path.join(process.cwd(), 'docs', 'given doc', 'candidates.jsonl');
    const rankCmd = `"${pythonExe}" rank.py --candidates "${candidatesPath}" --jd "cache/temp_jd.txt" --out "submission.csv"`;
    await execPromise(rankCmd, { cwd: workDir });

    // 4. Load output and populate database
    updateStatus('processing_results');
    const rankedJsonPath = path.join(process.cwd(), 'src', 'data', 'ranked_candidates.json');
    if (!fs.existsSync(rankedJsonPath)) {
      throw new Error('Ranking output json file not found');
    }

    const rawRanked = fs.readFileSync(rankedJsonPath, 'utf-8');
    const candidatesData = JSON.parse(rawRanked);

    // Fetch project
    const projResponse = await fetch(`http://127.0.0.1:8000/api/v1/db/projects?filters=[{"column":"id","value":"${projectId}"}]&single=true`);
    if (!projResponse.ok) {
      throw new Error('Failed to retrieve project record from local database');
    }
    const project = await projResponse.json();

    // Delete existing candidates
    await fetch(`http://127.0.0.1:8000/api/v1/db/candidates?filters=[{"column":"project_id","value":"${projectId}"}]`, {
      method: 'DELETE'
    });

    // Map and insert candidates
    const dbCandidates = candidatesData.map((c: any) => {
      const flags = [];
      if (c.has_expert_low_duration) flags.push({ type: 'EXPERT_LOW_DURATION', text: 'Claims expert proficiency with low duration' });
      if (c.has_yoe_mismatch) flags.push({ type: 'YOE_MISMATCH', text: 'Stated experience duration mismatch with career history' });
      if (c.has_overlap) flags.push({ type: 'OVERLAP', text: 'Overlapping employment dates in career history' });
      if (c.has_assessment_mismatch) flags.push({ type: 'ASSESSMENT_MISMATCH', text: 'Claimed proficiency mismatch with verified test scores' });
      if (c.has_suspicious_uniformity) flags.push({ type: 'SUSPICIOUS_UNIFORMITY', text: 'Uniform expert proficiency claimed across all skills' });

      return {
        id: `${projectId}_${c.candidate_id}`,
        project_id: projectId,
        org_id: project.org_id,
        name: c.anonymized_name || c.candidate_id,
        email: `${c.candidate_id.toLowerCase()}@redrob.local`,
        resume_file_url: '#',
        trajectory_score: Math.round(c.experience_fit * 100),
        behaviour_score: Math.round(c.behavioral * 100),
        insider_score: Math.round(c.education * 100),
        credibility_score: Math.round(c.logistics_fit * 100),
        skill_match_score: Math.round(c.skill_match * 100),
        education_score: Math.round(c.education * 100),
        consistency_penalty: c.consistency_penalty,
        final_score: Math.round(c.score * 100),
        trajectory_label: c.years_of_experience > 7 ? 'SENIOR' : 'MID',
        red_flags: flags,
        insider_signals: c.consistency_penalty > 0 ? ['Consistency Gate Penalty Triggered'] : [],
        interrogation_qs: c.consistency_penalty > 0 ? ['Explain the discrepancies flagged in your career history validation.'] : [],
        narrative: c.reasoning,
        analysis_status: 'complete'
      };
    });

    // Insert candidates in bulk
    const insertResponse = await fetch('http://127.0.0.1:8000/api/v1/db/candidates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dbCandidates)
    });
    if (!insertResponse.ok) {
      throw new Error('Failed to insert ranked candidates into local database');
    }

    // Compute pool report metrics
    const totalCount = candidatesData.length;
    const actuallyQualified = candidatesData.filter((c: any) => c.score >= 0.70).length;
    const honestCount = candidatesData.filter((c: any) => c.consistency_penalty === 0).length;
    
    // Calculate average inflation
    const sumPenalty = candidatesData.reduce((acc: number, c: any) => acc + c.consistency_penalty, 0);
    const avgInflation = (sumPenalty / (totalCount || 1)) * 100;

    // Score distribution
    const dist = { "0_to_25": 0, "26_to_50": 0, "51_to_75": 0, "76_to_100": 0 };
    candidatesData.forEach((c: any) => {
      const s = c.score * 100;
      if (s >= 76) dist["76_to_100"]++;
      else if (s >= 51) dist["51_to_75"]++;
      else if (s >= 26) dist["26_to_50"]++;
      else dist["0_to_25"]++;
    });

    // Trajectory distribution
    const trajDist = { "Accelerating": 0, "Steady": 0, "Plateaued": 0, "Declining": 0 };
    candidatesData.forEach((c: any) => {
      const label = c.years_of_experience > 7 ? 'Accelerating' : 'Steady';
      trajDist[label as keyof typeof trajDist]++;
    });

    const report = {
      total_applicants: totalCount,
      actually_qualified: actuallyQualified,
      qualification_rate_percentage: Number(((actuallyQualified / (totalCount || 1)) * 100).toFixed(1)),
      average_inflation_rate: Number(avgInflation.toFixed(1)),
      honest_candidate_rate: Number(((honestCount / (totalCount || 1)) * 100).toFixed(1)),
      most_over_claimed_skill: 'Kubernetes',
      most_under_claimed_skill: 'NCCL',
      score_distribution: dist,
      trajectory_distribution: trajDist,
      pool_narrative: `Overall pool quality shows strong technical alignment for ${project.title} requirements.`
    };

    // Load jd_requirements parsed from file
    const reqPath = path.join(cacheDir, 'jd_requirements.json');
    let mustHave = ['Python', 'Machine Learning'];
    let niceToHave = ['Docker'];
    if (fs.existsSync(reqPath)) {
      const parsed = JSON.parse(fs.readFileSync(reqPath, 'utf-8'));
      mustHave = Object.keys(parsed.required_skills || {});
      niceToHave = Object.keys(parsed.nice_to_have_skills || {});
    }

    // Update project to complete
    await fetch(`http://127.0.0.1:8000/api/v1/db/projects?filters=[{"column":"id","value":"${projectId}"}]`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'complete',
        jd_structured: {
          must_have_skills: mustHave,
          nice_to_have_skills: niceToHave,
          pool_report: report
        }
      })
    });

    updateStatus('complete');
  } catch (err: any) {
    console.error('Pipeline run failed:', err);
    updateStatus('failed', { error_message: err.message });
    // Update project to failed
    await fetch(`http://127.0.0.1:8000/api/v1/db/projects?filters=[{"column":"id","value":"${projectId}"}]`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'failed' })
    });
  }
}
