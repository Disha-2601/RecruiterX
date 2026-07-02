import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const csvPath = path.join(process.cwd(), 'redrob-ranker', 'submission.csv');
    if (!fs.existsSync(csvPath)) {
      return new Response('No submission.csv found. Please run the candidate analysis first.', { status: 404 });
    }

    const fileContent = fs.readFileSync(csvPath, 'utf-8');

    return new Response(fileContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="submission.csv"',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
