import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-analyze-token');
  if (!process.env.ANALYZE_TOKEN || token !== process.env.ANALYZE_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const jobs = Array.isArray(body.jobs) ? body.jobs : [];
  const origin = new URL(req.url).origin;

  const outputs = [];
  for (const job of jobs) {
    const resp = await fetch(`${origin}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(job)
    });
    outputs.push(await resp.json());
  }

  return NextResponse.json({ count: outputs.length, outputs });
}
