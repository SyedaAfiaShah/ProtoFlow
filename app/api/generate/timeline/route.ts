import { NextRequest, NextResponse } from 'next/server'
import { callGroq } from '@/lib/groq'
import { stripMarkdown } from '@/lib/utils'
import { ParsedHypothesis, ProtocolStep, TimelinePhase } from '@/lib/types'

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

    const protocolSummary = protocol
      .map(s => `Step ${s.step_number}: ${s.title} — Duration: ${s.duration}`)
      .join('\n')

    const systemPrompt = `You are a scientific project manager specialising in laboratory experiment planning.

Generate a realistic phased timeline for an experiment based on its protocol steps and domain.

CRITICAL RULES:
- Respond with ONLY a valid JSON array
- No markdown, no backticks, no explanation
- Start with [ and end with ]
- Base all durations on the actual protocol step durations provided
- Do not invent phases not supported by the protocol
- Always include a procurement phase at the start
- Always include a data analysis phase at the end`

    const userPrompt = `Generate a phased timeline for this experiment.

Domain: ${parsed.domain}
System: ${parsed.system}
Assay: ${parsed.assay_method}

Protocol steps and durations:
${protocolSummary}

Return a JSON array of 3-5 TimelinePhase objects:
[
  {
    "phase_number": 1,
    "phase_name": "Phase name",
    "duration_weeks": 1,
    "tasks": [
      "specific task 1",
      "specific task 2",
      "specific task 3"
    ],
    "dependencies": ["list phases this depends on, or empty array"],
    "milestone": "what marks completion of this phase"
  }
]

Required phases:
- Phase 1: Always "Reagent Procurement and Setup" (1-2 weeks)
- Middle phases: Derived from protocol steps grouped logically (preparation, execution, measurement)
- Last phase: Always "Data Analysis and Reporting" (1 week)

Tasks must be specific and actionable.
Total duration should be 4-8 weeks for most experiments.
Dependencies should reference phase names not numbers.`

    const raw = await callGroq(systemPrompt, userPrompt, 0.1, 1500)
    const cleaned = stripMarkdown(raw)

    let timeline: TimelinePhase[]
    try {
      timeline = JSON.parse(cleaned)
      if (!Array.isArray(timeline)) throw new Error('Not array')
    } catch {
      console.error('Timeline JSON parse failed:', raw)
      return NextResponse.json(
        { error: 'Failed to parse timeline response' },
        { status: 500 }
      )
    }

    return NextResponse.json(timeline)

  } catch (error) {
    console.error('Timeline route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
