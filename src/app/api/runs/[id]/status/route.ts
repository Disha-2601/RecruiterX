import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const runId = params.id;
    const workDir = path.join(process.cwd(), 'redrob-ranker');
    const runStatusPath = path.join(workDir, 'cache', 'runs', `${runId}.json`);

    if (!fs.existsSync(runStatusPath)) {
      return NextResponse.json({ error: 'Run status not found' }, { status: 404 });
    }

    const rawStatus = fs.readFileSync(runStatusPath, 'utf-8');
    const runStatus = JSON.parse(rawStatus);

    return NextResponse.json(runStatus);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
