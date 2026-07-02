import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const title = formData.get('title') as string;
    const jdFile = formData.get('jd') as File;
    const candidatesFile = formData.get('candidates') as File | null;
    const reindex = formData.get('reindex') === 'true';
    const skip_embed = formData.get('skip_embed') === 'true';

    if (!jdFile) {
      return NextResponse.json({ error: 'Missing Job Description file' }, { status: 400 });
    }

    // Working directories
    const workDir = path.join(process.cwd(), 'redrob-ranker');
    const cacheDir = path.join(workDir, 'cache');
    
    // Ensure cache directory exists
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    // Determine extensions and save names
    const jdExt = jdFile.name.endsWith('.docx') ? '.docx' : '.txt';
    const jdTempPath = path.join(cacheDir, `temp_jd${jdExt}`);
    const candTempPath = path.join(cacheDir, 'temp_candidates.jsonl');

    // Write uploaded files to temp cache paths
    const jdBuffer = Buffer.from(await jdFile.arrayBuffer());
    fs.writeFileSync(jdTempPath, jdBuffer);

    if (candidatesFile && candidatesFile.size > 0) {
      const candBuffer = Buffer.from(await candidatesFile.arrayBuffer());
      fs.writeFileSync(candTempPath, candBuffer);
    }

    // Locate the virtual environment Python interpreter
    const pythonExe = path.join(workDir, '.venv', 'Scripts', 'python.exe');
    if (!fs.existsSync(pythonExe)) {
      return NextResponse.json({ error: 'Python virtual environment interpreter not found in redrob-ranker/.venv' }, { status: 500 });
    }
    
    const executionLogs: string[] = [];
    executionLogs.push("[SYSTEM] Uploaded files received successfully.");

    if (skip_embed) {
      executionLogs.push("[SYSTEM] skip_embed set. Bypassing requirements extraction and index generation. Running only rank.py...");
    } else {
      // Step 1: parse_jd.py
      executionLogs.push("[SYSTEM] Executing parse_jd.py to extract requirements...");
      const jdCmd = `"${pythonExe}" parse_jd.py "${jdTempPath}"`;
      try {
        const { stdout, stderr } = await execPromise(jdCmd, { cwd: workDir });
        if (stdout) executionLogs.push(stdout.trim());
        if (stderr) executionLogs.push(`[WARN] ${stderr.trim()}`);
      } catch (err: any) {
        executionLogs.push(`[ERROR] JD Parsing failed: ${err.message}`);
        return NextResponse.json({ success: false, logs: executionLogs, error: 'JD Parsing failed' }, { status: 500 });
      }

      // Step 2: build_index.py or embed_jd.py
      const hasCache = fs.existsSync(path.join(cacheDir, 'candidate_features.parquet'));
      
      if (reindex && candidatesFile && candidatesFile.size > 0) {
        executionLogs.push("[SYSTEM] Executing build_index.py (Rebuilding full candidate index)...");
        const indexCmd = `"${pythonExe}" build_index.py "${candTempPath}"`;
        try {
          const { stdout, stderr } = await execPromise(indexCmd, { cwd: workDir });
          if (stdout) executionLogs.push(stdout.trim());
          if (stderr) executionLogs.push(`[WARN] ${stderr.trim()}`);
        } catch (err: any) {
          executionLogs.push(`[ERROR] Indexing failed: ${err.message}`);
          return NextResponse.json({ success: false, logs: executionLogs, error: 'Embedding Indexing failed' }, { status: 500 });
        }
      } else if (!hasCache) {
        return NextResponse.json({ error: 'Precomputed candidate index not found. Please upload candidates.jsonl and check "Rebuild Semantic Index" first.' }, { status: 400 });
      } else {
        executionLogs.push("[SYSTEM] Skipping candidate index rebuild. Running embed_jd.py to encode JD...");
        const embedCmd = `"${pythonExe}" embed_jd.py`;
        try {
          const { stdout, stderr } = await execPromise(embedCmd, { cwd: workDir });
          if (stdout) executionLogs.push(stdout.trim());
          if (stderr) executionLogs.push(`[WARN] ${stderr.trim()}`);
        } catch (err: any) {
          executionLogs.push(`[ERROR] JD Embedding failed: ${err.message}`);
          return NextResponse.json({ success: false, logs: executionLogs, error: 'JD Embedding failed' }, { status: 500 });
        }
      }
    }

    // Step 3: rank.py
    executionLogs.push("[SYSTEM] Executing rank.py (Vectorized ranking & scoring)...");
    const candPath = (candidatesFile && candidatesFile.size > 0) 
      ? candTempPath 
      : path.join(process.cwd(), 'docs', 'given doc', 'candidates.jsonl');
      
    const rankCmd = `"${pythonExe}" rank.py --candidates "${candPath}" --jd "${jdTempPath}" --out "submission.csv"`;
    try {
      const { stdout, stderr } = await execPromise(rankCmd, { cwd: workDir });
      if (stdout) executionLogs.push(stdout.trim());
      if (stderr) executionLogs.push(`[WARN] ${stderr.trim()}`);
    } catch (err: any) {
      executionLogs.push(`[ERROR] Ranking failed: ${err.message}`);
      return NextResponse.json({ success: false, logs: executionLogs, error: 'Candidate Ranking failed' }, { status: 500 });
    }

    executionLogs.push("[SYSTEM] Candidate shortlist generated successfully. Submission files updated.");
    return NextResponse.json({ success: true, logs: executionLogs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
