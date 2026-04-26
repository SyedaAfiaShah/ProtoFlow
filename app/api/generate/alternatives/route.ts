import { NextRequest, NextResponse } from 'next/server'
import { tavily } from '@tavily/core'
import { callGroq } from '@/lib/groq'
import { stripMarkdown } from '@/lib/utils'
import { Material, Alternative, ParsedHypothesis } from '@/lib/types'

const tavilyClient = tavily({
  apiKey: process.env.TAVILY_API_KEY ?? ''
})

async function findAlternativeForMaterial(
  material: Material,
  parsed: ParsedHypothesis
): Promise<Alternative> {
  
  const noAlternative: Alternative = {
    original_material: material.name,
    alternative_name: '',
    estimated_price_usd: 0,
    savings_percent: 0,
    reference_doi: '',
    reference_title: '',
    confidence: 'Low',
    cautionary_notes: [],
    protocol_adjustments: [],
    additional_controls: [],
    validated: false,
    no_alternative_reason: 
      'No validated published alternative found for this ' +
      'material in the context of this assay. Using an ' +
      'untested substitute risks compromising experimental ' +
      'validity.'
  }

  try {
    // Search for validated alternatives
    const query = 
      `${material.name} cheaper alternative ` +
      `${parsed.assay_method} validated published`
    
    const searchResult = await tavilyClient.search(query, {
      searchDepth: 'advanced',
      maxResults: 4,
      includeAnswer: false
    })

    const context = (searchResult.results ?? [])
      .slice(0, 3)
      .map((r, i) => 
        `Source ${i + 1}: ${r.title}\n` +
        `URL: ${r.url}\n` +
        `Content: ${(r.content ?? '').slice(0, 800)}`
      )
      .join('\n\n---\n\n')

    if (!context.trim()) return noAlternative

    const systemPrompt = `You are a scientific reagent specialist. Evaluate whether a validated cheaper alternative exists for a laboratory material.

CRITICAL RULES:
- Respond with ONLY a valid JSON object
- No markdown, no backticks, no explanation
- Start with { and end with }
- ONLY suggest an alternative if you find specific evidence in the provided sources that it works for this assay type
- If no validated alternative is found in the sources, return { "validated": false }
- A suggested alternative with no citation is MORE DANGEROUS than no suggestion
- Never fabricate DOIs, paper titles, or references`

    const userPrompt = `Evaluate if a cheaper validated alternative exists for this material.

Material: ${material.name}
Current price: $${material.unit_price_usd} per ${material.unit}
Assay context: ${parsed.assay_method}
Domain: ${parsed.domain}

Sources found:
${context}

If a validated cheaper alternative EXISTS in the sources:
Return this JSON:
{
  "validated": true,
  "alternative_name": "full name of alternative",
  "alternative_catalog": "catalog number if found, else null",
  "estimated_price_usd": 0.00,
  "savings_percent": 0,
  "reference_doi": "DOI if found in sources, else URL",
  "reference_title": "exact title from sources",
  "confidence": "High or Medium or Low",
  "cautionary_notes": [
    "scientific caveat 1",
    "scientific caveat 2"
  ],
  "protocol_adjustments": [
    "what changes in the protocol when using this alternative"
  ],
  "additional_controls": [
    "extra controls needed with this alternative"
  ]
}

If NO validated cheaper alternative exists in sources:
Return ONLY this:
{ "validated": false }

Rules for confidence:
- High: direct published evidence for this exact assay
- Medium: evidence in similar assays or cell types
- Low: general chemical equivalence only`

    const raw = await callGroq(systemPrompt, userPrompt, 0, 1000)
    const cleaned = stripMarkdown(raw)

    const result = JSON.parse(cleaned)

    if (!result.validated) return noAlternative

    return {
      original_material: material.name,
      alternative_name: result.alternative_name ?? '',
      alternative_catalog: result.alternative_catalog ?? undefined,
      estimated_price_usd: result.estimated_price_usd ?? 0,
      savings_percent: result.savings_percent ?? 0,
      reference_doi: result.reference_doi ?? '',
      reference_title: result.reference_title ?? '',
      confidence: result.confidence ?? 'Low',
      cautionary_notes: result.cautionary_notes ?? [],
      protocol_adjustments: result.protocol_adjustments ?? [],
      additional_controls: result.additional_controls ?? [],
      validated: true
    }

  } catch (error) {
    console.error(
      `Alternative search failed for ${material.name}:`, 
      error
    )
    return {
      ...noAlternative,
      no_alternative_reason: 'Search unavailable for this item.'
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed: ParsedHypothesis = body.parsed
    const selectedMaterials: Material[] = body.selected_materials ?? []

    if (selectedMaterials.length === 0) {
      return NextResponse.json([])
    }

    // Search for alternatives in parallel
    const alternatives = await Promise.all(
      selectedMaterials.map(m => findAlternativeForMaterial(m, parsed))
    )

    return NextResponse.json(alternatives)

  } catch (error) {
    console.error('Alternatives route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
