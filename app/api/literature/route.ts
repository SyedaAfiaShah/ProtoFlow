import { NextRequest, NextResponse } from 'next/server'
import { callGroq } from '@/lib/groq'
import { stripMarkdown } from '@/lib/utils'
import { ParsedHypothesis, LiteratureResult } from '@/lib/types'

const SS_URL = 'https://api.semanticscholar.org/graph/v1/paper/search'

async function searchSemanticScholar(query: string) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)
  try {
    const params = new URLSearchParams({
      query,
      fields: 'title,abstract,year,authors,externalIds',
      limit: '5'
    })
    const res = await fetch(`${SS_URL}?${params}`, {
      signal: controller.signal
    })
    clearTimeout(timeout)
    if (!res.ok) return []
    const data = await res.json()
    return data.data ?? []
  } catch {
    clearTimeout(timeout)
    return []
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dedupe(papers: any[]) {
  const seen = new Set()
  return papers.filter(p => {
    const doi = p.externalIds?.DOI
    if (!doi) return true
    if (seen.has(doi)) return false
    seen.add(doi)
    return true
  })
}

export async function POST(req: NextRequest) {
  const FALLBACK: LiteratureResult = {
    novelty_signal: 'not_found',
    explanation: 'Literature search unavailable. Proceeding with plan generation.',
    references: [],
    source: 'fallback'
  }

  try {
    const body = await req.json()
    const hypothesis: string = body.hypothesis ?? ''
    const parsed: ParsedHypothesis = body.parsed

    const queryA = `${parsed.intervention} ${parsed.assay_method}`
    const queryB = `${parsed.system} ${parsed.outcome}`

    const [resA, resB] = await Promise.all([
      searchSemanticScholar(queryA),
      searchSemanticScholar(queryB)
    ])

    const papers = dedupe([...resA, ...resB]).slice(0, 4)

    const papersContext = papers.length === 0
      ? 'No prior papers found.'
      : papers.map((p, i) => {
          const authors = p.authors
            ?.map((a: { name: string }) => a.name).join(', ') || 'Unknown'
          const abstract = (p.abstract ?? '').slice(0, 300)
          const doi = p.externalIds?.DOI ?? 'No DOI'
          return `Paper ${i + 1}:
Title: ${p.title ?? 'Unknown'}
Authors: ${authors}
Year: ${p.year ?? 'Unknown'}
DOI: ${doi}
Abstract: ${abstract}`
        }).join('\n\n')

    const systemPrompt = `You are a scientific literature analyst.
Classify hypothesis novelty based on published work.

CRITICAL RULES:
- Respond with ONLY a valid JSON object
- No markdown, no backticks, no explanation
- Start with { and end with }
- NEVER fabricate titles, authors, or DOIs
- Only use papers from the provided list
- Wrong citation is worse than no citation`

    const userPrompt = `Classify the novelty of this hypothesis.

Hypothesis: "${hypothesis}"

Papers found:
${papersContext}

Return this exact JSON:
{
  "novelty_signal": "not_found" or "similar_exists" or "exact_match",
  "explanation": "one sentence explaining the classification",
  "references": [
    {
      "title": "exact title from papers list only",
      "authors": "First Author et al.",
      "year": 2023,
      "doi": "exact DOI from papers list only",
      "relevance": "one sentence on how this relates"
    }
  ]
}

Rules:
- not_found: no papers study this intervention+system combo
- similar_exists: related work exists but not this exact experiment
- exact_match: this precise experiment has been published
- Include only 1-3 most relevant papers from the list above
- If none relevant or none found: return empty array []
- Never add papers not in the provided list above`

    const raw = await callGroq(systemPrompt, userPrompt, 0, 1000)
    const cleaned = stripMarkdown(raw)

    try {
      const result = JSON.parse(cleaned)
      return NextResponse.json({
        ...result,
        source: papers.length > 0 ? 'semantic_scholar' : 'fallback'
      } as LiteratureResult)
    } catch {
      console.error('Literature JSON parse failed:', raw)
      return NextResponse.json(FALLBACK)
    }

  } catch (error) {
    console.error('Literature route error:', error)
    return NextResponse.json(FALLBACK)
  }
}
