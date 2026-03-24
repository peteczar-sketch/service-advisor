export type ReviewSignal = {
  source: 'google' | 'yelp' | 'chamber' | 'other';
  rating?: number | null;
  text: string;
  date?: string | null;
};

export type CompanySummary = {
  company: string;
  positives: string[];
  complaints: string[];
  reliabilityScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'very-high';
  verdict: string;
  evidenceCount: number;
};

const POSITIVE_PATTERNS = [
  { pattern: /prompt|on time|timely|early/i, label: 'Prompt / timely service' },
  { pattern: /efficient|quick|fast/i, label: 'Efficient execution' },
  { pattern: /recommend|happy|great job|great service/i, label: 'Strong satisfaction / recommendation' },
  { pattern: /property lines|clean to the limits|attention to detail/i, label: 'Attention to detail' },
  { pattern: /improve|trying to improve/i, label: 'Shows improvement effort' }
];

const NEGATIVE_PATTERNS = [
  { pattern: /no show|did not show|didn't show|never came|never show up|missed/i, label: 'Missed visits / no-shows', penalty: 25 },
  { pattern: /no answer|don'?t answer|never answer|not answering|no-one answer|call and call/i, label: 'Poor communication / unreachable', penalty: 18 },
  { pattern: /refund|take your money|took .* money|scam|billing|quote/i, label: 'Billing / refund issues', penalty: 16 },
  { pattern: /late|not on time|inconsistent timing|3pm/i, label: 'Late or inconsistent timing', penalty: 10 },
  { pattern: /not properly cleaned|only do the upper part|won't go all the way|incomplete/i, label: 'Incomplete clearing', penalty: 12 },
  { pattern: /driver|training|respectful|unprofessional|mad right away/i, label: 'Driver / professionalism issues', penalty: 9 },
  { pattern: /can'?t access|unable to leave|stuck|cannot get out/i, label: 'Customer stranded / access blocked', penalty: 20 }
];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function uniqueTop(items: string[], max = 5): string[] {
  return [...new Set(items)].slice(0, max);
}

export function summarizeCompany(company: string, reviews: ReviewSignal[]): CompanySummary {
  let score = 75;
  const positives: string[] = [];
  const complaints: string[] = [];

  for (const review of reviews) {
    const text = review.text;
    if (typeof review.rating === 'number') {
      if (review.rating >= 4) score += 4;
      if (review.rating <= 2) score -= 7;
    }

    for (const rule of POSITIVE_PATTERNS) {
      if (rule.pattern.test(text)) {
        positives.push(rule.label);
        score += 3;
      }
    }

    for (const rule of NEGATIVE_PATTERNS) {
      if (rule.pattern.test(text)) {
        complaints.push(rule.label);
        score -= rule.penalty;
      }
    }
  }

  score = clamp(Math.round(score / Math.max(1, 1 + reviews.length * 0.08)), 5, 95);

  const riskLevel: CompanySummary['riskLevel'] =
    score >= 80 ? 'low' :
    score >= 60 ? 'medium' :
    score >= 35 ? 'high' : 'very-high';

  const verdict =
    riskLevel === 'low' ? 'Strong reliability signal across available evidence.' :
    riskLevel === 'medium' ? 'Promising, but evidence is mixed or limited.' :
    riskLevel === 'high' ? 'Meaningful reliability risk; use caution.' :
    'High probability of service failure based on repeated complaints.';

  return {
    company,
    positives: uniqueTop(positives, 5),
    complaints: uniqueTop(complaints, 7),
    reliabilityScore: score,
    riskLevel,
    verdict,
    evidenceCount: reviews.length
  };
}
