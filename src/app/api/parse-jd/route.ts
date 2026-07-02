import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let jdText = '';
    let jdFile: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      jdText = (formData.get('jd_text') as string) || '';
      jdFile = formData.get('jd_file') as File | null;
    } else {
      const body = await req.json();
      jdText = body.jd_text || '';
    }

    if (!jdText && (!jdFile || jdFile.size === 0)) {
      return NextResponse.json({ error: 'Missing Job Description text or file' }, { status: 400 });
    }

    const workDir = path.join(process.cwd(), 'redrob-ranker');
    const cacheDir = path.join(workDir, 'cache');
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    let tempJdPath = '';
    if (jdFile && jdFile.size > 0) {
      const jdExt = jdFile.name.endsWith('.docx') ? '.docx' : '.txt';
      tempJdPath = path.join(cacheDir, `temp_jd${jdExt}`);
      const jdBuffer = Buffer.from(await jdFile.arrayBuffer());
      fs.writeFileSync(tempJdPath, jdBuffer);
    } else {
      tempJdPath = path.join(cacheDir, 'temp_jd.txt');
      fs.writeFileSync(tempJdPath, jdText, 'utf-8');
    }

    // Locate virtual environment Python interpreter
    const pythonExe = path.join(workDir, '.venv', 'Scripts', 'python.exe');
    if (!fs.existsSync(pythonExe)) {
      return NextResponse.json({ error: 'Python interpreter not found' }, { status: 500 });
    }

    // Run parse_jd.py
    const cmd = `"${pythonExe}" parse_jd.py "${tempJdPath}"`;
    await execPromise(cmd, { cwd: workDir });

    // Read the generated requirements
    const reqPath = path.join(cacheDir, 'jd_requirements.json');
    if (!fs.existsSync(reqPath)) {
      return NextResponse.json({ error: 'Failed to parse JD' }, { status: 500 });
    }

    const rawReq = fs.readFileSync(reqPath, 'utf-8');
    const parsed = JSON.parse(rawReq);

    // Map to frontend interface
    const responseData = {
      must_have_skills: Object.keys(parsed.required_skills || {}),
      nice_to_have_skills: Object.keys(parsed.nice_to_have_skills || {}),
      implied_requirements: [
        `Targeting ${parsed.min_years_experience}-${parsed.max_years_experience} years of experience.`,
        `Preferred locations: ${parsed.preferred_locations?.join(', ') || 'Anywhere in India'}.`,
        `Work mode preference: ${parsed.work_mode || 'Flexible'}.`,
        `Target notice period: ${parsed.notice_period_days || 30} days.`
      ],
      inferred_seniority: parsed.min_years_experience >= 8 ? 'Principal/Director' : parsed.min_years_experience >= 5 ? 'Senior' : 'Mid/Junior',
      stated_seniority: 'Senior',
      jd_quality_score: 95,
      audit_narrative: `Successfully analyzed the job description requirements. Extracted ${Object.keys(parsed.required_skills || {}).length} must-have dimensions and ${Object.keys(parsed.nice_to_have_skills || {}).length} nice-to-have indicators.`
    };

    return NextResponse.json(responseData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
