import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const workDir = path.join(process.cwd(), 'redrob-ranker');
    const reqPath = path.join(workDir, 'cache', 'jd_requirements.json');

    if (!fs.existsSync(reqPath)) {
      return NextResponse.json({ error: 'Cached requirements not found. Please upload a JD first.' }, { status: 404 });
    }

    const rawReq = fs.readFileSync(reqPath, 'utf-8');
    const parsed = JSON.parse(rawReq);

    // Map to frontend interface exactly like parse-jd route does
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
