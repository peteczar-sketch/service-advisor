import OpenAI from 'openai';

export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

export async function aiSummarizeCompany(input: {
  company: string;
  reviews: Array<{ source: string; rating?: number | null; text: string; date?: string | null }>;
  fallback: {
    positives: string[];
    complaints: string[];
    reliabilityScore: number;
    riskLevel: string;
    verdict: string;
    evidenceCount: number;
  };
}) {
  const client = getOpenAIClient();
  if (!client) return input.fallback;

  const model = process.env.OPENAI_MODEL || 'gpt-5-mini';
  const reviews = input.reviews
    .filter(r => r.text?.trim())
    .slice(0, 60)
    .map(r => ({ source: r.source, rating: r.rating ?? null, date: r.date ?? null, text: r.text.slice(0, 700) }));

  const response = await client.responses.create({
    model,
    input: [
      {
        role: 'system',
        content: [
          {
            type: 'input_text',
            text: `You are a review intelligence engine analyzing local service businesses. Return strict JSON only with keys: positives, complaints, reliabilityScore, riskLevel, verdict. Focus on repeated patterns. Severe penalties for no-shows, missed service, customers stranded, non-response, refund problems. Risk levels must be one of: low, medium, high, very-high.`
          }
        ]
      },
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: JSON.stringify({ company: input.company, reviews, fallback: input.fallback })
          }
        ]
      }
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'company_summary',
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            positives: { type: 'array', items: { type: 'string' }, maxItems: 5 },
            complaints: { type: 'array', items: { type: 'string' }, maxItems: 7 },
            reliabilityScore: { type: 'number' },
            riskLevel: { type: 'string', enum: ['low', 'medium', 'high', 'very-high'] },
            verdict: { type: 'string' }
          },
          required: ['positives', 'complaints', 'reliabilityScore', 'riskLevel', 'verdict']
        }
      }
    }
  });

  const text = response.output_text;
  const parsed = JSON.parse(text);
  return {
    ...parsed,
    reliabilityScore: Math.max(5, Math.min(95, Math.round(parsed.reliabilityScore))),
    evidenceCount: input.fallback.evidenceCount
  };
}
