import { NextRequest, NextResponse } from 'next/server'
import { callGroq } from '@/lib/groq'
import { stripMarkdown } from '@/lib/utils'
import { ParsedHypothesis } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY not configured' },
        { status: 500 }
      )
    }

    const body = await req.json()
    const hypothesis: string = body.hypothesis ?? ''

    if (hypothesis.trim().length < 30) {
      return NextResponse.json({
        valid_hypothesis: false,
        validation_message:
          'Please provide a more specific hypothesis. Include: ' +
          'what you are changing (intervention), what you expect ' +
          'to happen (outcome), and how you will measure it (assay).'
      } as Partial<ParsedHypothesis>)
    }

    const systemPrompt = `You are a scientific hypothesis parser.
Extract structured information from scientific hypotheses.
CRITICAL: Respond with ONLY a valid JSON object.
No markdown, no backticks, no explanation.
Start with { and end with }.`

    const userPrompt = `Parse this hypothesis. Return JSON only:
{
  "intervention": "what is being changed or tested",
  "outcome": "what result is expected",
  "system": "the biological/chemical/physical system",
  "assay_method": "how the outcome will be measured",
  "threshold": "quantitative target if mentioned, else 'not specified'",
  "control_condition": "the baseline being compared against",
  "domain": "one of: cell_biology, diagnostics, chemistry, climate, neuroscience, pharmacology, materials_science, other",
  "valid_hypothesis": true or false,
  "validation_message": "if invalid explain why, if valid use empty string"
}

Hypothesis: "${hypothesis}"`

    const raw = await callGroq(systemPrompt, userPrompt, 0, 800)
    const cleaned = stripMarkdown(raw)

    let parsed: ParsedHypothesis
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      console.error('JSON parse failed:', raw)
      return NextResponse.json(
        { error: 'Failed to parse model response' },
        { status: 500 }
      )
    }

    return NextResponse.json(parsed)

  } catch (error) {
    console.error('Parse route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
