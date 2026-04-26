import jsPDF from 'jspdf'

export async function exportPlanToPDF(plan: {
  hypothesis: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parsed: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protocol: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  materials: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  budget: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  timeline: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validation: any
}): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  const contentWidth = pageWidth - margin * 2
  let y = 20

  function addPageIfNeeded(height: number) {
    if (y + height > 270) {
      doc.addPage()
      y = 20
    }
  }

  function heading1(text: string) {
    addPageIfNeeded(12)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(31, 78, 121)
    doc.text(text, margin, y)
    y += 10
  }

  function heading2(text: string) {
    addPageIfNeeded(10)
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(46, 117, 182)
    doc.text(text, margin, y)
    y += 8
  }

  function body(text: string, indent = 0) {
    addPageIfNeeded(7)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(50, 50, 50)
    const lines = doc.splitTextToSize(text, contentWidth - indent)
    doc.text(lines, margin + indent, y)
    y += lines.length * 5.5
  }

  function divider() {
    addPageIfNeeded(6)
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, y, pageWidth - margin, y)
    y += 6
  }

  // COVER
  doc.setFillColor(10, 15, 30)
  doc.rect(0, 0, pageWidth, 40, 'F')
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('ProtoFlow', margin, 22)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(150, 160, 200)
  doc.text('AI-Generated Experiment Plan', margin, 32)
  y = 50

  // HYPOTHESIS
  heading1('Hypothesis')
  body(plan.hypothesis)
  y += 4

  // PARSED ENTITIES
  heading2('Parsed Entities')
  body(`Intervention: ${plan.parsed.intervention}`)
  body(`System: ${plan.parsed.system}`)
  body(`Assay Method: ${plan.parsed.assay_method}`)
  body(`Threshold: ${plan.parsed.threshold}`)
  body(`Control: ${plan.parsed.control_condition}`)
  body(`Domain: ${plan.parsed.domain}`)
  y += 4
  divider()

  // PROTOCOL
  heading1('Protocol')
  plan.protocol?.forEach((step: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    heading2(`Step ${step.step_number}: ${step.title}`)
    body(step.description, 4)
    body(`Duration: ${step.duration}`, 4)
    if (step.critical_note) {
      body(`! Critical: ${step.critical_note}`, 4)
    }
    y += 3
  })
  divider()

  // MATERIALS
  heading1('Materials')
  plan.materials?.forEach((mat: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    body(
      `- ${mat.name} — ${mat.catalog_number} ` +
      `(${mat.supplier}) — ` +
      `${mat.quantity} ${mat.unit} — ` +
      `$${mat.unit_price_usd}`
    )
  })
  y += 4
  divider()

  // BUDGET
  heading1('Budget Summary')
  if (plan.budget) {
    body(`Materials: $${plan.budget.materials_total}`)
    body(`Equipment: $${plan.budget.equipment_cost}`)
    body(`Personnel: $${plan.budget.personnel_cost}`)
    body(`Indirect: $${plan.budget.indirect_cost}`)
    doc.setFont('helvetica', 'bold')
    body(`TOTAL: $${plan.budget.total}`)
    doc.setFont('helvetica', 'normal')
    y += 2
    body(plan.budget.disclaimer)
  }
  y += 4
  divider()

  // TIMELINE
  heading1('Timeline')
  const totalWeeks = plan.timeline?.reduce(
    (s: number, p: any) => s + p.duration_weeks, 0 // eslint-disable-line @typescript-eslint/no-explicit-any
  ) ?? 0
  body(`Total Duration: ${totalWeeks} weeks`)
  y += 2
  plan.timeline?.forEach((phase: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    heading2(
      `Phase ${phase.phase_number}: ${phase.phase_name} ` +
      `(${phase.duration_weeks} weeks)`
    )
    phase.tasks?.forEach((t: string) => body(`- ${t}`, 4))
    body(`Milestone: ${phase.milestone}`, 4)
    y += 2
  })
  divider()

  // VALIDATION
  heading1('Validation Strategy')
  if (plan.validation) {
    heading2('Success Criteria')
    plan.validation.success_criteria?.forEach(
      (c: string) => body(`+ ${c}`, 4)
    )
    heading2('Failure Criteria')
    plan.validation.failure_criteria?.forEach(
      (c: string) => body(`x ${c}`, 4)
    )
    heading2('Statistical Test')
    body(plan.validation.statistical_test, 4)
    body(`Sample Size: ${plan.validation.sample_size}`, 4)
    heading2('Controls')
    plan.validation.controls?.forEach((c: any) => // eslint-disable-line @typescript-eslint/no-explicit-any
      body(`[${c.type.toUpperCase()}] ${c.description}`, 4)
    )
    heading2('Standard Applied')
    body(plan.validation.standard_applied, 4)
  }

  // FOOTER on each page
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `ProtoFlow — AI Experiment Planner — Page ${i} of ${totalPages}`,
      margin,
      287
    )
    doc.text(
      `Generated: ${new Date().toLocaleDateString()}`,
      pageWidth - margin - 40,
      287
    )
  }

  doc.save('ProtoFlow-Experiment-Plan.pdf')
}
