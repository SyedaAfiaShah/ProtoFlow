import { NextRequest, NextResponse } from 'next/server'
import { callGroq } from '@/lib/groq'
import { stripMarkdown } from '@/lib/utils'
import { Material, Budget, BudgetLine, ParsedHypothesis } from '@/lib/types'

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
    const materials: Material[] = body.materials ?? []

    // Calculate materials total from actual materials list
    // This is pure math — no LLM needed for this part
    const materialsBreakdown: BudgetLine[] = materials.map(m => ({
      category: 'Materials' as const,
      item: `${m.name} (${m.catalog_number})`,
      cost_usd: Number((m.unit_price_usd * m.quantity).toFixed(2))
    }))

    const materials_total = Number(
      materialsBreakdown
        .reduce((sum, b) => sum + b.cost_usd, 0)
        .toFixed(2)
    )

    // Use Groq to estimate non-materials costs
    // based on domain and experiment complexity
    const systemPrompt = `You are a scientific budget analyst.
Estimate realistic non-materials costs for a laboratory 
experiment based on its domain and complexity.

CRITICAL RULES:
- Respond with ONLY a valid JSON object
- No markdown, no backticks, no explanation
- Start with { and end with }
- Be realistic — these are estimates a PI would trust
- Personnel costs = researcher time at $35/hour
- Equipment = amortised usage cost, not purchase price
- Indirect = typically 40-60% of direct costs`

    const userPrompt = `Estimate non-materials costs for 
this experiment.

Domain: ${parsed.domain}
System: ${parsed.system}
Assay: ${parsed.assay_method}
Materials cost already calculated: $${materials_total}

Return this exact JSON:
{
  "equipment_cost": 0.00,
  "personnel_cost": 0.00,
  "indirect_cost": 0.00,
  "equipment_lines": [
    { "item": "equipment or service name", "cost": 0.00 }
  ],
  "personnel_lines": [
    { "item": "role and time e.g. Research Assistant 20hrs", "cost": 0.00 }
  ],
  "indirect_lines": [
    { "item": "indirect cost item", "cost": 0.00 }
  ]
}

Guidelines:
- equipment_cost: lab equipment usage fees, core facility charges, instrument time. Realistic range $200-$2000
- personnel_cost: researcher and assistant time. Realistic range $500-$3000 depending on complexity
- indirect_cost: overhead, facilities. Usually 40-50% of materials + personnel combined
- Include 2-4 line items per category
- Costs must sum correctly to their category total`

    const raw = await callGroq(systemPrompt, userPrompt, 0, 1000)
    const cleaned = stripMarkdown(raw)

    let groqEstimates: {
      equipment_cost: number
      personnel_cost: number
      indirect_cost: number
      equipment_lines: { item: string; cost: number }[]
      personnel_lines: { item: string; cost: number }[]
      indirect_lines: { item: string; cost: number }[]
    }

    try {
      groqEstimates = JSON.parse(cleaned)
    } catch {
      console.error('Budget JSON parse failed:', raw)
      // Fallback estimates if Groq fails
      groqEstimates = {
        equipment_cost: 800,
        personnel_cost: 1200,
        indirect_cost: 600,
        equipment_lines: [
          { item: 'Lab equipment usage', cost: 800 }
        ],
        personnel_lines: [
          { item: 'Research time (estimated)', cost: 1200 }
        ],
        indirect_lines: [
          { item: 'Overhead and facilities', cost: 600 }
        ]
      }
    }

    // Build complete breakdown
    const equipmentBreakdown: BudgetLine[] = 
      groqEstimates.equipment_lines.map(l => ({
        category: 'Equipment' as const,
        item: l.item,
        cost_usd: l.cost
      }))

    const personnelBreakdown: BudgetLine[] = 
      groqEstimates.personnel_lines.map(l => ({
        category: 'Personnel' as const,
        item: l.item,
        cost_usd: l.cost
      }))

    const indirectBreakdown: BudgetLine[] = 
      groqEstimates.indirect_lines.map(l => ({
        category: 'Indirect' as const,
        item: l.item,
        cost_usd: l.cost
      }))

    const total = Number((
      materials_total +
      groqEstimates.equipment_cost +
      groqEstimates.personnel_cost +
      groqEstimates.indirect_cost
    ).toFixed(2))

    const budget: Budget = {
      materials_total,
      equipment_cost: groqEstimates.equipment_cost,
      personnel_cost: groqEstimates.personnel_cost,
      indirect_cost: groqEstimates.indirect_cost,
      total,
      breakdown: [
        ...materialsBreakdown,
        ...equipmentBreakdown,
        ...personnelBreakdown,
        ...indirectBreakdown
      ],
      disclaimer:
        'All costs are estimates. Materials prices based on ' +
        'Sigma-Aldrich list prices. Verify current pricing ' +
        'before submitting grant applications or orders.'
    }

    return NextResponse.json(budget)

  } catch (error) {
    console.error('Budget route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
