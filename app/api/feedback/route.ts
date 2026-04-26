import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { FeedbackItem } from '@/lib/types'

// POST — save feedback items to Supabase
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const items: FeedbackItem[] = body.items ?? []

    if (items.length === 0) {
      return NextResponse.json({ success: false, error: 'No items provided' })
    }

    const supabase = createServiceClient()

    const { error } = await supabase
      .from('feedback')
      .insert(items.map(item => ({
        domain: item.domain,
        assay_method: item.assay_method,
        section: item.section,
        item_label: item.item_label,
        original_text: item.original_text,
        correction: item.correction,
        rating: item.rating
      })))

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      count: items.length 
    })

  } catch (error) {
    console.error('Feedback POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET — retrieve relevant feedback for injection
// Query params: domain, assay_method, section
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const domain = searchParams.get('domain') ?? ''
    const assay_method = searchParams.get('assay_method') ?? ''
    const section = searchParams.get('section') ?? 'protocol'

    const supabase = createServiceClient()

    // Find corrections for same domain + assay type
    // Most recent first, limit to 5
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .eq('domain', domain)
      .eq('assay_method', assay_method)
      .eq('section', section)
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) {
      console.error('Supabase fetch error:', error)
      return NextResponse.json([])
    }

    // Also try matching just by domain if no exact match
    if (!data || data.length === 0) {
      const { data: domainData } = await supabase
        .from('feedback')
        .select('*')
        .eq('domain', domain)
        .eq('section', section)
        .order('created_at', { ascending: false })
        .limit(3)
      
      return NextResponse.json(domainData ?? [])
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Feedback GET error:', error)
    return NextResponse.json([])
  }
}
