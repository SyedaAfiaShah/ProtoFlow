import { NextRequest, NextResponse } from 'next/server'
import { callGroq } from '@/lib/groq'
import { stripMarkdown } from '@/lib/utils'
import { ParsedHypothesis, ProtocolStep, ValidationStrategy } from '@/lib/types'

// Domain to standards mapping
const DOMAIN_STANDARDS: Record<string, string> = {
  cell_biology: 'ATCC cell culture quality guidelines',
  diagnostics: 'Clinical validation standards (sensitivity/specificity)',
  chemistry: 'ICH Q2(R1) analytical validation guidelines',
  climate: 'IPCC data reporting standards',
  neuroscience: 'ARRIVE 2.0 guidelines for animal research',
  pharmacology: 'ICH Q2(R1) and GLP guidelines',
  materials_science: 'ASTM standard test methods',
  other: 'General scientific reproducibility standards'
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY not configured' },
        { status: 500 }
      )
    }

    const body = await req.json()
    const parsed: ParsedHypothesis = body.parsed
    const protocol: ProtocolStep[] = body.protocol ?? []

    const standardApplied = DOMAIN_STANDARDS[parsed.domain] ?? DOMAIN_STANDARDS.other

    const protocolStepTitles = protocol
      .map(s => s.title)
      .join(', ')

    const systemPrompt = `You are a scientific validation expert. Generate a rigorous validation strategy for a laboratory experiment.

CRITICAL RULES:
- Respond with ONLY a valid JSON object
- No markdown, no backticks, no explanation
- Start with { and end with }
- Success criteria must be derived directly from the hypothesis threshold
- Statistical test must be appropriate for the domain
- Controls must be scientifically standard for the assay`

    const userPrompt = `Generate a validation strategy for this experiment.

Hypothesis details:
- Intervention: ${parsed.intervention}
- Outcome: ${parsed.outcome}
- System: ${parsed.system}
- Assay: ${parsed.assay_method}
- Threshold: ${parsed.threshold}
- Control: ${parsed.control_condition}
- Domain: ${parsed.domain}

Protocol steps: ${protocolStepTitles}
Applicable standard: ${standardApplied}

Return this exact JSON object:
{
  "success_criteria": [
    "criterion 1 derived from threshold",
    "criterion 2",
    "criterion 3"
  ],
  "failure_criteria": [
    "what would invalidate the result 1",
    "what would invalidate the result 2"
  ],
  "statistical_test": "specific test name and parameters e.g. Student t-test two-tailed alpha=0.05",
  "sample_size": "e.g. n=6 biological replicates per condition minimum",
  "controls": [
    {
      "type": "positive",
      "description": "what the positive control is"
    },
    {
      "type": "negative",
      "description": "what the negative control is"
    },
    {
      "type": "technical",
      "description": "technical replicate details"
    }
  ],
  "qc_checkpoints": [
    "checkpoint at phase 1",
    "checkpoint at phase 2",
    "checkpoint at phase 3",
    "checkpoint at phase 4"
  ],
  "standard_applied": "${standardApplied}"
}

Requirements:
- success_criteria: 3 criteria, first must directly reference the threshold from the hypothesis
- failure_criteria: 2 criteria covering statistical and practical failure modes
- statistical_test: domain-appropriate, specific
- sample_size: justify the number with power analysis rationale
- controls: exactly 3, one of each type
- qc_checkpoints: 4 checkpoints, one per major phase`

    const raw = await callGroq(systemPrompt, userPrompt, 0.1, 1500)
    const cleaned = stripMarkdown(raw)

    let validation: ValidationStrategy
    try {
      validation = JSON.parse(cleaned)
    } catch {
      console.error('Validation JSON parse failed:', raw)
      return NextResponse.json(
        { error: 'Failed to parse validation response' },
        { status: 500 }
      )
    }

    return NextResponse.json(validation)

  } catch (error) {
    console.error('Validation route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
