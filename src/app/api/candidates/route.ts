import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const dataPath = path.join(process.cwd(), 'src', 'data', 'ranked_candidates.json');
    if (!fs.existsSync(dataPath)) {
      return NextResponse.json([]);
    }
    const fileContent = fs.readFileSync(dataPath, 'utf-8');
    const candidates = JSON.parse(fileContent);
    return NextResponse.json(candidates);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
