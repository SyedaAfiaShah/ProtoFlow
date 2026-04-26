import { NextRequest, NextResponse } from 'next/server'
import { callGroq } from '@/lib/groq'
import { stripMarkdown, constructSigmaUrl } from '@/lib/utils'
import { ParsedHypothesis, ProtocolStep, Material, FeedbackItem } from '@/lib/types'

async function getRelevantFeedback(domain: string, assayMethod: string): Promise<string> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
      ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
    const res = await fetch(
      `${baseUrl}/api/feedback?domain=${encodeURIComponent(domain)}&assay_method=${encodeURIComponent(assayMethod)}&section=materials`
    )
    const feedback = await res.json()
    
    if (!feedback || feedback.length === 0) return ''

    const examples = feedback
      .slice(0, 3)
      .map((f: FeedbackItem) => 
        `- Item "${f.item_label}": ` +
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
    const protocol: ProtocolStep[] = body.protocol ?? []

    // Build protocol context — extract reagents mentioned
    const protocolSummary = protocol
      .map(s => `Step ${s.step_number}: ${s.title} — ${s.description}`)
      .join('\n')

    const systemPrompt = `You are a laboratory supply specialist 
with deep knowledge of scientific reagent catalogs.

Your job is to generate a precise materials list for an 
experiment based on its protocol steps.

CRITICAL RULES:
- Respond with ONLY a valid JSON array
- No markdown, no backticks, no explanation
- Start with [ and end with ]
- Use ONLY real Sigma-Aldrich catalog numbers from your 
  training knowledge
- Common examples: Trehalose T9531, DMSO D2650, 
  Trypan Blue T8154, DMEM D5796, FBS F2442,
  PBS P5368, Penicillin-Streptomycin P4333
- If uncertain about a catalog number set verify_catalog: true
- A wrong catalog number is worse than flagging it
- Estimate realistic market prices in USD
- Items over $150 must have is_expensive: true`

    const userPrompt = `Generate a complete materials list 
for this experiment.

Hypothesis: "${hypothesis}"
Domain: ${parsed.domain}
System: ${parsed.system}
Assay: ${parsed.assay_method}

Protocol steps (extract all reagents and equipment needed):
${protocolSummary}

Return a JSON array of Material objects:
[
  {
    "name": "full reagent or equipment name",
    "catalog_number": "real Sigma-Aldrich catalog number",
    "supplier": "Sigma-Aldrich",
    "quantity": 1,
    "unit": "g or mL or units etc",
    "unit_price_usd": 85.00,
    "storage": "storage condition e.g. -20C or RT or 4C",
    "verify_catalog": false,
    "is_expensive": false
  }
]

Requirements:
- Include every reagent mentioned in the protocol steps
- Include consumables: tubes, filters, plates as needed
- Include one major equipment item if protocol requires it
- 8 to 14 items total
- Quantities must be realistic for the experiment scale
- Prices must be realistic market estimates
- is_expensive: true for any item over $150
- verify_catalog: true if you are not fully confident 
  in the catalog number`

    const feedbackContext = await getRelevantFeedback(parsed.domain, parsed.assay_method)
    const finalSystemPrompt = systemPrompt + feedbackContext

    const raw = await callGroq(
      finalSystemPrompt,
      userPrompt,
      0,
      2000
    )
    const cleaned = stripMarkdown(raw)

    let materials: Material[]
    try {
      const parsed_materials = JSON.parse(cleaned)
      if (!Array.isArray(parsed_materials)) {
        throw new Error('Not an array')
      }

      // Construct supplier URLs server-side
      // Never trust client to build these
      materials = parsed_materials.map((m: Material) => ({
        ...m,
        supplier_url: constructSigmaUrl(m.catalog_number),
        price_source: 'estimated' as const
      }))

    } catch {
      console.error('Materials JSON parse failed:', raw)
      return NextResponse.json(
        { error: 'Failed to parse materials response' },
        { status: 500 }
      )
    }

    return NextResponse.json(materials)

  } catch (error) {
    console.error('Materials route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
