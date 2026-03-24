'use client';

import { useState } from 'react';

type Result = {
  company: string;
  sources: Array<{ source: string; rating: number | null; reviewCount: number | null; url: string | null }>;
  summary: {
    positives: string[];
    complaints: string[];
    reliabilityScore: number;
    riskLevel: string;
    verdict: string;
    evidenceCount: number;
  };
};

export default function HomePage() {
  const [query, setQuery] = useState('snow removal');
  const [city, setCity] = useState('Laval');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [error, setError] = useState('');

  async function run() {
    setLoading(true);
    setError('');
    try {
      const resp = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, city })
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || 'Request failed');
      setResults(json.results || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <h1>Review Intelligence</h1>
      <p>Fully automated business lookup + review analysis for local services.</p>
      <div className="controls">
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Service" />
        <input value={city} onChange={e => setCity(e.target.value)} placeholder="City" />
        <button onClick={run} disabled={loading}>{loading ? 'Analyzing…' : 'Analyze'}</button>
      </div>
      {error ? <p className="error">{error}</p> : null}
      <div className="results">
        {results.map((r, i) => (
          <section key={`${r.company}-${i}`} className="card">
            <div className="row">
              <h2>{i + 1}. {r.company}</h2>
              <span className={`badge ${r.summary.riskLevel}`}>{r.summary.riskLevel}</span>
            </div>
            <p><strong>Reliability:</strong> {r.summary.reliabilityScore}/100</p>
            <p><strong>Verdict:</strong> {r.summary.verdict}</p>
            <p><strong>Evidence count:</strong> {r.summary.evidenceCount}</p>
            <div className="grid">
              <div>
                <h3>Positives</h3>
                <ul>{r.summary.positives.map((p, idx) => <li key={idx}>{p}</li>)}</ul>
              </div>
              <div>
                <h3>Complaints</h3>
                <ul>{r.summary.complaints.map((c, idx) => <li key={idx}>{c}</li>)}</ul>
              </div>
            </div>
            <h3>Sources</h3>
            <ul>
              {r.sources.map((s, idx) => <li key={idx}>{s.source}: rating {s.rating ?? 'n/a'}, reviews {s.reviewCount ?? 'n/a'}</li>)}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
