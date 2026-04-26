import { NextRequest, NextResponse } from 'next/server'
import { tavily } from '@tavily/core'
import { callGroq } from '@/lib/groq'
import { stripMarkdown } from '@/lib/utils'
import { ParsedHypothesis, ProtocolStep, FeedbackItem } from '@/lib/types'

const tavilyClient = tavily({
  apiKey: process.env.TAVILY_API_KEY ?? ''
})

async function fetchProtocols(
  parsed: ParsedHypothesis
): Promise<string> {
  try {
    const queryA = 
      `${parsed.assay_method} protocol site:protocols.io`
    const queryB = 
      `${parsed.domain} ${parsed.intervention} experimental method`

    const [resA, resB] = await Promise.all([
      tavilyClient.search(queryA, {
        searchDepth: 'advanced',
        maxResults: 3,
        includeAnswer: false
      }),
      tavilyClient.search(queryB, {
        searchDepth: 'basic',
        maxResults: 3,
        includeAnswer: false
      })
    ])

    const allResults = [
      ...(resA.results ?? []),
      ...(resB.results ?? [])
    ]

    if (allResults.length === 0) {
      return 'No published protocols found via web search.'
    }

    return allResults
      .slice(0, 4)
      .map((r, i) => {
        const content = (r.content ?? '').slice(0, 1500)
        return `Source ${i + 1}: ${r.title ?? 'Unknown'}
URL: ${r.url ?? ''}
Content: ${content}`
      })
      .join('\n\n---\n\n')

  } catch (error) {
    console.error('Tavily search failed:', error)
    return 'Protocol search unavailable. Using domain knowledge.'
  }
}

async function getRelevantFeedback(domain: string, assayMethod: string): Promise<string> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
      ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
    const res = await fetch(
      `${baseUrl}/api/feedback?domain=${encodeURIComponent(domain)}&assay_method=${encodeURIComponent(assayMethod)}&section=protocol`
    )
    const feedback = await res.json()
    
    if (!feedback || feedback.length === 0) return ''

    const examples = feedback
      .slice(0, 3)
      .map((f: FeedbackItem) => 
        `- Step "${f.item_label}": ` +
        `Original: "${f.original_text}" → ` +
        `Expert correction: "${f.correction}" ` +
        `(rated ${f.rating}/5)`
      )
      .join('\n')

    return `\n\nEXPERT CORRECTIONS FROM SIMILAR EXPERIMENTS:\n` +
      `Apply these learnings where applicable:\n${examples}`
  } catch {
    return ''
  }
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
    const hypothesis: string = body.hypothesis ?? ''
    const parsed: ParsedHypothesis = body.parsed

    const protocolContext = await fetchProtocols(parsed)

    const systemPrompt = `You are a senior experimental scientist
specialising in ${parsed.domain}.

Your job is to generate a detailed, step-by-step experiment
protocol that adapts real published methodologies to a
specific hypothesis.

CRITICAL RULES:
- Respond with ONLY a valid JSON array
- No markdown, no backticks, no explanation
- Start with [ and end with ]
- Do not invent steps unsupported by published practice
- Be specific: use real reagent names, volumes, temperatures
- If a step is adapted from a retrieved source, note it in
  source_protocol field
- If no source found for a step, use domain best practice
  and omit source_protocol
- Include ALL experimental parameters found in the papers (temperatures, concentrations, incubation times).
- Include appropriate experimental controls based on the papers.
- NEVER fabricate citations. Ensure all generated methodologies are grounded in the provided papers.`

    const userPrompt = `Generate a protocol for this experiment.

Hypothesis: "${hypothesis}"

Parsed details:
- Intervention: ${parsed.intervention}
- System: ${parsed.system}
- Assay method: ${parsed.assay_method}
- Control: ${parsed.control_condition}
- Domain: ${parsed.domain}

Real published protocols retrieved for reference:
${protocolContext}

Return a JSON array of 8-12 ProtocolStep objects:
[
  {
    "step_number": 1,
    "title": "short step title",
    "description": "detailed, specific instruction with exact volumes, temperatures, timings",
    "duration": "e.g. 45 minutes or overnight",
    "critical_note": "safety or QC warning if applicable, omit field if not needed",
    "source_protocol": "URL or name of source if adapted from retrieved protocol, omit if not"
  }
]

Requirements:
- 8 to 12 steps total
- Every step must have step_number, title, description, duration
- critical_note only when genuinely important
- Steps must follow logical experimental order:
  preparation -> execution -> measurement -> analysis
- Be operationally specific — a lab tech should be able to
  follow this on Monday morning`

    const feedbackContext = await getRelevantFeedback(parsed.domain, parsed.assay_method)
    const finalSystemPrompt = systemPrompt + feedbackContext

    const raw = await callGroq(
      finalSystemPrompt,
      userPrompt,
      0.2,
      3000
    )
    const cleaned = stripMarkdown(raw)

    let protocol: ProtocolStep[]
    try {
      protocol = JSON.parse(cleaned)
      if (!Array.isArray(protocol)) throw new Error('Not array')
    } catch {
      console.error('Protocol JSON parse failed:', raw)
      return NextResponse.json(
        { error: 'Failed to parse protocol response' },
        { status: 500 }
      )
    }

    return NextResponse.json(protocol)

  } catch (error) {
    console.error('Protocol route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
