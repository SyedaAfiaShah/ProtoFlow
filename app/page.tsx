'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FlaskConical, Loader2, ArrowRight, Sparkles, CheckCircle2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ParsedHypothesis, LiteratureResult, ProtocolStep, Material, Budget, TimelinePhase, ValidationStrategy, Alternative, ModuleStatus } from '@/lib/types'
import LiteratureQC from '@/components/LiteratureQC'
import ProtocolTab from '@/components/tabs/ProtocolTab'
import MaterialsTab from '@/components/tabs/MaterialsTab'
import BudgetTab from '@/components/tabs/BudgetTab'
import TimelineTab from '@/components/tabs/TimelineTab'
import ValidationTab from '@/components/tabs/ValidationTab'
import LitmusSubmit from '@/components/LitmusSubmit'
import ReviewPanel from '@/components/ReviewPanel'
import { exportPlanToPDF } from '@/lib/export-pdf'

const EXAMPLES = [
  {
    label: '🧊 Trehalose Cryo',
    text: 'Replacing sucrose with trehalose as a cryoprotectant in the freezing medium will increase post-thaw viability of HeLa cells by at least 15 percentage points compared to standard DMSO protocol, due to trehalose superior membrane stabilization.'
  },
  {
    label: '🔬 Anti-CRP Biosensor',
    text: 'Developing an electrochemical biosensor using anti-CRP antibodies immobilized on a gold electrode will detect C-reactive protein in whole blood at concentrations as low as 1 ng/mL, achieving sensitivity comparable to standard ELISA methods.'
  },
  {
    label: '🧠 Gut-Brain Axis',
    text: 'Supplementing germ-free mice with Lactobacillus rhamnosus will reduce anxiety-like behaviour by at least 30 percent on the elevated plus maze compared to controls, mediated by vagal nerve signalling.'
  },
  {
    label: '🌱 Biochar Carbon',
    text: 'Applying biochar derived from agricultural waste at 10 tonnes per hectare will increase soil organic carbon by 20 percent over 12 months compared to untreated plots, measured by loss-on-ignition analysis.'
  }
]

export default function Home() {
  const [hypothesis, setHypothesis] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [parsed, setParsed] = useState<ParsedHypothesis | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [literature, setLiterature] = useState<LiteratureResult | null>(null)
  const [litStatus, setLitStatus] = useState<ModuleStatus>('idle')
  const [protocol, setProtocol] = useState<ProtocolStep[] | null>(null)
  const [protocolStatus, setProtocolStatus] = useState<ModuleStatus>('idle')
  const [materials, setMaterials] = useState<Material[] | null>(null)
  const [materialsStatus, setMaterialsStatus] = useState<ModuleStatus>('idle')
  const [budget, setBudget] = useState<Budget | null>(null)
  const [budgetStatus, setBudgetStatus] = useState<ModuleStatus>('idle')
  const [timeline, setTimeline] = useState<TimelinePhase[] | null>(null)
  const [timelineStatus, setTimelineStatus] = useState<ModuleStatus>('idle')
  const [validation, setValidation] = useState<ValidationStrategy | null>(null)
  const [validationStatus, setValidationStatus] = useState<ModuleStatus>('idle')
  const [alternatives, setAlternatives] = useState<Alternative[]>([])
  const [usingAlternatives, setUsingAlternatives] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [feedbackCount, setFeedbackCount] = useState(0)

  const handleGenerate = async () => {
    if (hypothesis.length < 30) return
    setIsGenerating(true)
    setError(null)
    setParsed(null)
    setLiterature(null)
    setLitStatus('idle')
    setProtocol(null)
    setProtocolStatus('idle')
    setMaterials(null)
    setMaterialsStatus('idle')
    setBudget(null)
    setBudgetStatus('idle')
    setTimeline(null)
    setTimelineStatus('idle')
    setValidation(null)
    setValidationStatus('idle')
    setAlternatives([])
    setUsingAlternatives(false)
    setFeedbackCount(0)

    try {
      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hypothesis })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to parse hypothesis')
      }

      if (!data.valid_hypothesis) {
        setError(data.validation_message || 'Invalid hypothesis.')
      } else {
        setParsed(data)

        setLitStatus('loading')
        fetch('/api/literature', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hypothesis, parsed: data })
        })
          .then((r) => r.json())
          .then((lit) => {
            setLiterature(lit)
            setLitStatus('done')
          })
          .catch(() => setLitStatus('error'))

        setProtocolStatus('loading')
        try {
          const protRes = await fetch('/api/generate/protocol', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hypothesis, parsed: data })
          })
          const protData = await protRes.json()
          if (Array.isArray(protData)) {
            setProtocol(protData)
            setProtocolStatus('done')

            setTimelineStatus('loading')
            setValidationStatus('loading')
            setMaterialsStatus('loading')

            try {
              const [timelineRes, validationRes, matRes] = await Promise.all([
                fetch('/api/generate/timeline', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ parsed: data, protocol: protData })
                }),
                fetch('/api/generate/validation', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ parsed: data, protocol: protData })
                }),
                fetch('/api/generate/materials', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    hypothesis,
                    parsed: data,
                    protocol: protData
                  })
                })
              ])

              const [timelineData, validationData, matData] = await Promise.all([
                timelineRes.json().catch(() => null),
                validationRes.json().catch(() => null),
                matRes.json().catch(() => null)
              ])

              if (Array.isArray(timelineData)) {
                setTimeline(timelineData)
                setTimelineStatus('done')
              } else {
                setTimelineStatus('error')
              }

              if (validationData && validationData.success_criteria) {
                setValidation(validationData)
                setValidationStatus('done')
              } else {
                setValidationStatus('error')
              }

              if (Array.isArray(matData)) {
                setMaterials(matData)
                setMaterialsStatus('done')

                setBudgetStatus('loading')
                try {
                  const budgetRes = await fetch('/api/generate/budget', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      parsed: data,
                      materials: matData
                    })
                  })
                  const budgetData = await budgetRes.json()
                  if (budgetData.total !== undefined) {
                    setBudget(budgetData)
                    setBudgetStatus('done')
                  } else {
                    setBudgetStatus('error')
                  }
                } catch {
                  setBudgetStatus('error')
                }
              } else {
                setMaterialsStatus('error')
              }
            } catch {
              setTimelineStatus('error')
              setValidationStatus('error')
              setMaterialsStatus('error')
            }
          } else {
            setProtocolStatus('error')
          }
        } catch {
          setProtocolStatus('error')
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || 'An unexpected error occurred.')
      } else {
        setError('An unexpected error occurred.')
      }
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleExportPDF() {
    setIsExporting(true)
    await exportPlanToPDF({
      hypothesis,
      parsed: parsed!,
      protocol: protocol ?? [],
      materials: materials ?? [],
      budget: budget ?? null,
      timeline: timeline ?? [],
      validation: validation ?? null
    })
    setIsExporting(false)
  }

  const hasDashboard = parsed !== null && !error

  return (
    <main className="min-h-screen bg-[#F7F4EF] text-[#2C2C2C]">

      {/* ── Sticky nav bar (dashboard mode only) ── */}
      {hasDashboard && (
        <header className="sticky top-0 z-20 px-4 py-3 border-b border-[#DDD8CF] bg-[#F7F4EF]/95 backdrop-blur-sm shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FlaskConical className="text-[#7C9A7E] w-5 h-5" />
              <span className="font-bold text-lg text-[#2C2C2C]">ProtoFlow</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="border-[#7C9A7E] text-[#4A6B4C] bg-[#EBF0EB] py-1">
                <Sparkles className="w-3 h-3 mr-2" />
                Hack-Nation 2026
              </Badge>
              {budgetStatus === 'done' && (
                <button
                  onClick={handleExportPDF}
                  disabled={isExporting}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[#EEE9E0] hover:bg-[#DDD8CF] text-[#2C2C2C] text-sm rounded-lg border border-[#DDD8CF] transition"
                >
                  {isExporting ? (
                    <><Loader2 size={13} className="animate-spin" />Generating PDF...</>
                  ) : (
                    <><Download size={13} />Download Plan</>
                  )}
                </button>
              )}
            </div>
          </div>
        </header>
      )}

      {/* ── Landing / single-column view ── */}
      {!hasDashboard && (
        <div className="px-4 py-16">
          <div className="max-w-2xl mx-auto space-y-12">
            {/* Hero */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-4"
            >
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#7C9A7E] to-[#4A6B4C]">
                ProtoFlow
              </h1>

              <p className="text-[#5C5C5C] max-w-xl mx-auto text-lg leading-relaxed">
                From hypothesis to executable experiments
              </p>
            </motion.div>

            {/* Input Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="bg-white border-[#DDD8CF] shadow-md overflow-hidden">
                <CardHeader className="bg-[#FAFAF8] border-b border-[#E8E3DA]">
                  <CardTitle className="flex items-center text-[#2C2C2C]">
                    <FlaskConical className="w-5 h-5 mr-2 text-[#7C9A7E]" />
                    Your Scientific Hypothesis
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="space-y-2 relative">
                    <Textarea
                      value={hypothesis}
                      onChange={(e) => setHypothesis(e.target.value)}
                      placeholder="e.g. Adding X to Y will increase Z by N%, measured by [assay], compared to [control]..."
                      className="bg-[#F7F4EF] border-[#DDD8CF] focus-visible:ring-[#7C9A7E] text-[#2C2C2C] placeholder:text-[#8C8C8C] min-h-[140px] resize-y"
                    />
                    <div className="absolute bottom-2 right-2 text-xs text-[#8C8C8C]">
                      {hypothesis.length} chars
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium text-[#5C5C5C]">Try an example:</label>
                    <div className="flex flex-wrap gap-2">
                      {EXAMPLES.map((example, i) => (
                        <button
                          key={i}
                          onClick={() => setHypothesis(example.text)}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full border border-[#DDD8CF] bg-[#EEE9E0] text-[#2C2C2C] hover:bg-[#DDD8CF] transition-colors"
                        >
                          {example.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {error && (
                    <Alert className="bg-[#FBF0F0] border-[#D4A0A0] text-[#8B4545]">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || hypothesis.length < 30}
                    className="w-full bg-[#7C9A7E] hover:bg-[#6B8A6D] text-white rounded-xl py-6 text-lg font-medium shadow-md shadow-[#7C9A7E]/20 transition-all active:scale-[0.98]"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Analysing hypothesis...
                      </>
                    ) : (
                      <>
                        Generate Experiment Plan
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Loading skeleton while parsing */}
            {isGenerating && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                <div className="flex items-center gap-2 text-[#5C5C5C] text-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-[#7C9A7E]" />
                  Parsing hypothesis...
                </div>
                <Skeleton className="h-3 w-full bg-[#DDD8CF]" />
                <Skeleton className="h-3 w-3/4 bg-[#DDD8CF]" />
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* ── Dashboard: two-panel layout ── */}
      {hasDashboard && (
        <div className="px-4 py-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

            {/* ── LEFT PANEL ── */}
            <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-[65px]">

              {/* Condensed Input Card */}
              <Card className="bg-white border-[#DDD8CF] shadow-sm overflow-hidden">
                <CardHeader className="bg-[#FAFAF8] border-b border-[#E8E3DA] py-3">
                  <CardTitle className="flex items-center text-[#2C2C2C] text-sm">
                    <FlaskConical className="w-4 h-4 mr-2 text-[#7C9A7E]" />
                    Hypothesis
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="relative">
                    <Textarea
                      value={hypothesis}
                      onChange={(e) => setHypothesis(e.target.value)}
                      placeholder="Enter hypothesis..."
                      className="bg-[#F7F4EF] border-[#DDD8CF] focus-visible:ring-[#7C9A7E] text-[#2C2C2C] placeholder:text-[#8C8C8C] min-h-[100px] resize-y text-sm"
                    />
                    <div className="absolute bottom-2 right-2 text-xs text-[#8C8C8C]">
                      {hypothesis.length}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {EXAMPLES.map((example, i) => (
                      <button
                        key={i}
                        onClick={() => setHypothesis(example.text)}
                        className="inline-flex items-center px-2.5 py-1 text-[10px] font-medium rounded-full border border-[#DDD8CF] bg-[#EEE9E0] text-[#5C5C5C] hover:bg-[#DDD8CF] transition-colors"
                      >
                        {example.label}
                      </button>
                    ))}
                  </div>
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || hypothesis.length < 30}
                    className="w-full bg-[#7C9A7E] hover:bg-[#6B8A6D] text-white rounded-lg py-2.5 text-sm font-medium transition-all active:scale-[0.98]"
                  >
                    {isGenerating ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analysing...</>
                    ) : (
                      <>Regenerate Plan<ArrowRight className="w-4 h-4 ml-2" /></>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Parsed Entities Card */}
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', bounce: 0.3 }}
                >
                  <Card className="bg-white border-[#DDD8CF] shadow-sm overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#7C9A7E] to-[#4A6B4C]" />
                    <CardHeader className="pb-3 border-b border-[#E8E3DA] flex flex-row justify-between items-center bg-[#FAFAF8]">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-[#4A6B4C]" />
                        <CardTitle className="text-[#2C2C2C] text-sm">Parsed Successfully</CardTitle>
                      </div>
                      <Badge variant="outline" className="bg-[#EBF0EB] text-[#4A6B4C] border-[#7C9A7E] capitalize text-[10px]">
                        {parsed.domain.replace('_', ' ')}
                      </Badge>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3">
                      {[
                        { label: 'Intervention', value: parsed.intervention },
                        { label: 'Outcome', value: parsed.outcome },
                        { label: 'System', value: parsed.system },
                        { label: 'Assay Method', value: parsed.assay_method },
                        { label: 'Threshold', value: parsed.threshold },
                        { label: 'Control Condition', value: parsed.control_condition },
                      ].map(({ label, value }) => (
                        <div key={label} className="space-y-0.5">
                          <div className="text-[10px] font-semibold text-[#8C8C8C] uppercase tracking-wider">{label}</div>
                          <div className="text-xs text-[#2C2C2C]">{value}</div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatePresence>

              {/* Literature QC */}
              {litStatus === 'loading' && (
                <Card className="bg-white border-[#DDD8CF] shadow-sm">
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-[#7C9A7E]" />
                      <span className="text-[#5C5C5C] text-sm">Searching literature...</span>
                    </div>
                    <Skeleton className="h-3 w-full bg-[#DDD8CF]" />
                    <Skeleton className="h-3 w-3/4 bg-[#DDD8CF]" />
                    <Skeleton className="h-3 w-1/2 bg-[#DDD8CF]" />
                  </CardContent>
                </Card>
              )}
              {litStatus === 'done' && literature && (
                <LiteratureQC result={literature} />
              )}
              {litStatus === 'error' && (
                <p className="text-[#8C8C8C] text-sm italic">
                  Literature search unavailable — plan generation continues.
                </p>
              )}
            </div>

            {/* ── RIGHT PANEL ── */}
            <div className="lg:col-span-2 space-y-4">

              {/* Status Pills */}
              <div className="flex flex-wrap gap-2">
                {[
                  { name: 'Literature', status: litStatus },
                  { name: 'Protocol', status: protocolStatus },
                  { name: 'Materials', status: materialsStatus },
                  { name: 'Budget', status: budgetStatus },
                  { name: 'Timeline', status: timelineStatus },
                  { name: 'Validation', status: validationStatus }
                ].map((m) => (
                  <div
                    key={m.name}
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border ${
                      m.status === 'idle'
                        ? 'bg-[#EEE9E0] text-[#5C5C5C] border-[#DDD8CF]'
                        : m.status === 'loading'
                        ? 'bg-[#EBF0EB] text-[#4A6B4C] border-[#7C9A7E] shadow-sm'
                        : m.status === 'done'
                        ? 'bg-[#EBF0EB] text-[#4A6B4C] border-[#7C9A7E]'
                        : 'bg-[#FBF0F0] text-[#8B4545] border-[#D4A0A0]'
                    }`}
                  >
                    {m.status === 'loading' && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
                    {m.status === 'done' && <CheckCircle2 className="w-3 h-3 mr-1.5" />}
                    {m.status === 'error' && <span className="mr-1.5">✕</span>}
                    {m.name}
                  </div>
                ))}
              </div>

              {/* Alternatives Notice */}
              {usingAlternatives && (
                <div className="px-3 py-2 bg-[#FBF5EC] border border-[#D4B896] rounded-lg flex items-center justify-between">
                  <span className="text-[#A67C52] text-xs">
                    ⚡ Showing alternative plan with substituted materials
                  </span>
                  <button
                    onClick={() => { setUsingAlternatives(false); setAlternatives([]) }}
                    className="text-[#A67C52] text-xs underline"
                  >
                    Revert to original
                  </button>
                </div>
              )}

              {/* Tabs */}
              <Tabs defaultValue="protocol" className="w-full">
                <TabsList className="bg-[#EEE9E0] border border-[#DDD8CF] mb-4 p-1 rounded-xl w-full">
                  <TabsTrigger
                    value="protocol"
                    className="rounded-lg data-[state=active]:bg-[#7C9A7E] data-[state=active]:text-white text-[#5C5C5C] transition-all"
                  >
                    Protocol
                  </TabsTrigger>
                  <TabsTrigger
                    value="materials"
                    disabled={materialsStatus === 'idle'}
                    className="rounded-lg data-[state=active]:bg-[#7C9A7E] data-[state=active]:text-white text-[#5C5C5C] transition-all"
                  >
                    Materials
                    {materialsStatus === 'loading' && <Loader2 className="ml-1.5 h-3 w-3 animate-spin" />}
                  </TabsTrigger>
                  <TabsTrigger
                    value="budget"
                    disabled={budgetStatus === 'idle'}
                    className="rounded-lg data-[state=active]:bg-[#7C9A7E] data-[state=active]:text-white text-[#5C5C5C] transition-all"
                  >
                    Budget
                    {budgetStatus === 'loading' && <Loader2 className="ml-1.5 h-3 w-3 animate-spin" />}
                  </TabsTrigger>
                  <TabsTrigger
                    value="timeline"
                    disabled={timelineStatus === 'idle'}
                    className="rounded-lg data-[state=active]:bg-[#7C9A7E] data-[state=active]:text-white text-[#5C5C5C] transition-all"
                  >
                    Timeline
                    {timelineStatus === 'loading' && <Loader2 className="ml-1.5 h-3 w-3 animate-spin" />}
                  </TabsTrigger>
                  <TabsTrigger
                    value="validation"
                    disabled={validationStatus === 'idle'}
                    className="rounded-lg data-[state=active]:bg-[#7C9A7E] data-[state=active]:text-white text-[#5C5C5C] transition-all"
                  >
                    Validation
                    {validationStatus === 'loading' && <Loader2 className="ml-1.5 h-3 w-3 animate-spin" />}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="protocol" className="mt-0 outline-none">
                  {protocolStatus === 'loading' && (
                    <div className="space-y-3 mt-4">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-24 bg-[#EEE9E0] border border-[#DDD8CF] rounded-xl relative overflow-hidden flex items-center justify-center">
                          {i === 1 && (
                            <div className="flex flex-col items-center gap-2 text-[#5C5C5C]">
                              <Loader2 className="w-5 h-5 animate-spin text-[#7C9A7E]" />
                              <span className="text-sm font-medium">Generating protocol from retrieved literature...</span>
                            </div>
                          )}
                          <Skeleton className="absolute inset-0 bg-[#DDD8CF] opacity-30" />
                        </div>
                      ))}
                    </div>
                  )}
                  {protocolStatus === 'done' && protocol && <ProtocolTab steps={protocol} />}
                  {protocolStatus === 'error' && (
                    <Alert className="bg-[#FBF0F0] border-[#D4A0A0] text-[#8B4545] mt-4">
                      <AlertDescription>Protocol generation failed. Please retry.</AlertDescription>
                    </Alert>
                  )}
                </TabsContent>

                <TabsContent value="materials" className="mt-0 outline-none">
                  {materialsStatus === 'loading' && (
                    <div className="space-y-2 mt-4">
                      {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full bg-[#DDD8CF] rounded-lg" />
                      ))}
                    </div>
                  )}
                  {materialsStatus === 'done' && materials && <MaterialsTab materials={materials} />}
                  {materialsStatus === 'error' && (
                    <p className="text-[#8B4545] text-sm mt-4">Materials generation failed. Please retry.</p>
                  )}
                </TabsContent>

                <TabsContent value="budget" className="mt-0 outline-none">
                  {budgetStatus === 'loading' && (
                    <div className="space-y-3 mt-4">
                      <div className="grid grid-cols-2 gap-3">
                        {[...Array(4)].map((_, i) => (
                          <Skeleton key={i} className="h-20 bg-[#DDD8CF] rounded-xl" />
                        ))}
                      </div>
                      <Skeleton className="h-12 bg-[#DDD8CF] rounded-xl" />
                      <Skeleton className="h-32 bg-[#DDD8CF] rounded-xl" />
                    </div>
                  )}
                  {budgetStatus === 'done' && budget && (
                    <BudgetTab
                      budget={budget}
                      parsed={parsed!}
                      materials={materials ?? []}
                      alternatives={alternatives}
                      onAlternativesFound={(alts) => {
                        setAlternatives(alts)
                        setUsingAlternatives(alts.length > 0)
                      }}
                    />
                  )}
                  {budgetStatus === 'error' && (
                    <p className="text-[#8B4545] text-sm mt-4">Budget generation failed. Please retry.</p>
                  )}
                </TabsContent>

                <TabsContent value="timeline" className="mt-0 outline-none">
                  {timelineStatus === 'loading' && (
                    <div className="space-y-3 mt-4">
                      {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-28 bg-[#DDD8CF] rounded-xl" />
                      ))}
                    </div>
                  )}
                  {timelineStatus === 'done' && timeline && <TimelineTab phases={timeline} />}
                  {timelineStatus === 'error' && (
                    <p className="text-[#8B4545] text-sm mt-4">Timeline generation failed. Please retry.</p>
                  )}
                </TabsContent>

                <TabsContent value="validation" className="mt-0 outline-none">
                  {validationStatus === 'loading' && (
                    <div className="space-y-3 mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Skeleton className="h-32 bg-[#DDD8CF] rounded-xl" />
                        <Skeleton className="h-32 bg-[#DDD8CF] rounded-xl" />
                      </div>
                      <Skeleton className="h-24 bg-[#DDD8CF] rounded-xl" />
                      <Skeleton className="h-40 bg-[#DDD8CF] rounded-xl" />
                    </div>
                  )}
                  {validationStatus === 'done' && validation && <ValidationTab validation={validation} />}
                  {validationStatus === 'error' && (
                    <p className="text-[#8B4545] text-sm mt-4">Validation strategy generation failed. Please retry.</p>
                  )}
                </TabsContent>
              </Tabs>

              {/* Submit to CRO */}
              {parsed && budgetStatus === 'done' && (
                <LitmusSubmit
                  plan={{
                    hypothesis,
                    parsed: parsed,
                    protocol: protocol ?? undefined,
                    materials: materials ?? undefined,
                    budget: budget ?? undefined,
                    timeline: timeline ?? undefined,
                    validation: validation ?? undefined,
                    alternatives: alternatives.length > 0 ? alternatives : undefined,
                    generated_at: new Date().toISOString()
                  }}
                  disabled={budgetStatus !== 'done'}
                />
              )}

              {/* Expert Review Panel */}
              {protocol && materials && budgetStatus === 'done' && (
                <div>
                  <ReviewPanel
                    protocol={protocol}
                    materials={materials}
                    parsed={parsed!}
                    onFeedbackSubmitted={(count) => setFeedbackCount(count)}
                  />
                  {feedbackCount > 0 && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center text-[#4A6B4C] text-xs mt-2 font-medium"
                    >
                      ✓ {feedbackCount} correction(s) saved — next similar plan will reflect your feedback
                    </motion.p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
