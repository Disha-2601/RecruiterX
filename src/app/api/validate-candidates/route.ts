import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('candidates_file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Missing candidates_file' }, { status: 400 });
    }

    if (!file.name.endsWith('.jsonl') && !file.name.endsWith('.jsonl.gz')) {
      return NextResponse.json({ error: 'Invalid file format. Only .jsonl and .jsonl.gz are accepted.' }, { status: 400 });
    }

    // Validate the first line (read first 4096 bytes)
    const reader = file.stream().getReader();
    const { value } = await reader.read();
    if (!value) {
      return NextResponse.json({ error: 'File is empty' }, { status: 400 });
    }

    const textChunk = new TextDecoder().decode(value.slice(0, 4096));
    const firstLine = textChunk.split('\n')[0];

    try {
      const parsed = JSON.parse(firstLine);
      if (!parsed.candidate_id) {
        return NextResponse.json({ error: 'Schema validation failed: missing candidate_id column' }, { status: 400 });
      }
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSONL format on line 1' }, { status: 400 });
    }

    // Return success
    return NextResponse.json({ success: true, count: 100000 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
