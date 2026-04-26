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

  return (
    <main className="min-h-screen bg-[#0a0f1e] text-slate-300 py-16 px-4">
      <div className="max-w-2xl mx-auto space-y-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ staggerChildren: 0.1 }}
          className="text-center space-y-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Badge variant="outline" className="border-indigo-500/30 text-indigo-300 mb-6 py-1">
              <Sparkles className="w-3 h-3 mr-2" />
              ✦ Hack-Nation 2026 · AI Scientist Challenge
            </Badge>
          </motion.div>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
            Turn your hypothesis into a <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-500">
              complete experiment plan
            </span>
          </h1>

          <p className="text-slate-400 max-w-xl mx-auto text-lg leading-relaxed">
            RAG-powered planning grounded in real published protocols, live supplier data, and peer-reviewed literature.
          </p>
        </motion.div>

        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-[#111827] border-slate-700/50 shadow-xl overflow-hidden">
            <CardHeader className="bg-[#111827]/80 backdrop-blur-sm border-b border-slate-800/50">
              <CardTitle className="flex items-center text-slate-200">
                <FlaskConical className="w-5 h-5 mr-2 text-indigo-400" />
                Your Scientific Hypothesis
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2 relative">
                <Textarea
                  value={hypothesis}
                  onChange={(e) => setHypothesis(e.target.value)}
                  placeholder="e.g. Adding X to Y will increase Z by N%, measured by [assay], compared to [control]..."
                  className="bg-[#1a2235] border-slate-600 focus-visible:ring-indigo-500 text-white min-h-[140px] resize-y"
                />
                <div className="absolute bottom-2 right-2 text-xs text-slate-500">
                  {hypothesis.length} chars
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-400">Try an example:</label>
                <div className="flex flex-wrap gap-2">
                  {EXAMPLES.map((example, i) => (
                    <button
                      key={i}
                      onClick={() => setHypothesis(example.text)}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full border border-slate-700 bg-[#1a2235] text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                      {example.label}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <Alert variant="destructive" className="bg-red-950/20 border-red-900/50 text-red-400">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || hypothesis.length < 30}
                className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white rounded-xl py-6 text-lg font-medium shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]"
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

        {/* Parsed Result Card */}
        <AnimatePresence>
          {parsed && !error && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', bounce: 0.4 }}
            >
              <Card className="bg-[#111827] border-slate-700/50 shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-green-500 to-emerald-600" />
                <CardHeader className="pb-4 border-b border-slate-800/50 flex flex-row justify-between items-center bg-[#111827]/80 backdrop-blur-sm">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <CardTitle className="text-white">Hypothesis Parsed Successfully</CardTitle>
                  </div>
                  <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 capitalize">
                    Valid · {parsed.domain.replace('_', ' ')}
                  </Badge>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Intervention</div>
                      <div className="text-sm text-slate-200">{parsed.intervention}</div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Outcome</div>
                      <div className="text-sm text-slate-200">{parsed.outcome}</div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">System</div>
                      <div className="text-sm text-slate-200">{parsed.system}</div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assay Method</div>
                      <div className="text-sm text-slate-200">{parsed.assay_method}</div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Threshold</div>
                      <div className="text-sm text-slate-200">{parsed.threshold}</div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Control Condition</div>
                      <div className="text-sm text-slate-200">{parsed.control_condition}</div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800/50 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30">
                        {parsed.domain}
                      </Badge>
                    </div>
                    <div className="text-sm font-mono text-green-400 bg-green-400/10 px-2 py-1 rounded">
                      valid_hypothesis: true
                    </div>
                  </div>
                </CardContent>
              </Card>
              {protocolStatus === 'idle' && (
                <div className="mt-4 text-center text-sm text-slate-500 flex items-center justify-center">
                  ⟳ Plan generation continues...
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {litStatus === 'loading' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4"
          >
            <Card className="bg-[#111827] border-slate-700/50">
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                  <span className="text-slate-400 text-sm">
                    Searching literature...
                  </span>
                </div>
                <Skeleton className="h-3 w-full bg-slate-700" />
                <Skeleton className="h-3 w-3/4 bg-slate-700" />
                <Skeleton className="h-3 w-1/2 bg-slate-700" />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {litStatus === 'done' && literature && (
          <div className="mt-4">
            <LiteratureQC result={literature} />
          </div>
        )}

        {litStatus === 'error' && (
          <p className="text-slate-500 text-sm mt-2 italic">
            Literature search unavailable — continuing with plan generation.
          </p>
        )}

        {protocolStatus !== 'idle' && (
          <div className="mt-6 space-y-6">
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
                      ? 'bg-slate-800 text-slate-400 border-slate-700/50'
                      : m.status === 'loading'
                      ? 'bg-indigo-900/50 text-indigo-300 border-indigo-500/30 shadow-sm shadow-indigo-500/10'
                      : m.status === 'done'
                      ? 'bg-emerald-900/40 text-emerald-300 border-emerald-500/30'
                      : 'bg-red-900/40 text-red-300 border-red-500/30'
                  }`}
                >
                  {m.status === 'loading' && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
                  {m.status === 'done' && <CheckCircle2 className="w-3 h-3 mr-1.5" />}
                  {m.status === 'error' && <span className="mr-1.5">✕</span>}
                  {m.name}
                </div>
              ))}
            </div>

            {budgetStatus === 'done' && (
              <div className="flex justify-end">
                <button
                  onClick={handleExportPDF}
                  disabled={isExporting}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg border border-slate-600 transition"
                >
                  {isExporting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <Download size={14} />
                      Download Plan
                    </>
                  )}
                </button>
              </div>
            )}

            {usingAlternatives && (
              <div className="px-3 py-2 bg-amber-900/30 border border-amber-500/30 rounded-lg flex items-center justify-between">
                <span className="text-amber-300 text-xs">
                  ⚡ Showing alternative plan with substituted materials
                </span>
                <button
                  onClick={() => { setUsingAlternatives(false); setAlternatives([]) }}
                  className="text-amber-400 text-xs underline"
                >
                  Revert to original
                </button>
              </div>
            )}

            {/* Tabs */}
            <Tabs defaultValue="protocol" className="w-full">
              <TabsList className="bg-slate-800/50 border border-slate-700/50 mb-4 p-1 rounded-xl w-full">
                <TabsTrigger
                  value="protocol"
                  className="rounded-lg data-[active]:bg-indigo-600 data-[active]:text-white text-slate-400 transition-all"
                >
                  Protocol
                </TabsTrigger>
                <TabsTrigger
                  value="materials"
                  disabled={materialsStatus === 'idle'}
                  className="rounded-lg data-[active]:bg-indigo-600 data-[active]:text-white text-slate-400 transition-all"
                >
                  Materials
                  {materialsStatus === 'loading' && (
                    <Loader2 className="ml-1.5 h-3 w-3 animate-spin" />
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="budget"
                  disabled={budgetStatus === 'idle'}
                  className="rounded-lg data-[active]:bg-indigo-600 data-[active]:text-white text-slate-400 transition-all"
                >
                  Budget
                  {budgetStatus === 'loading' && (
                    <Loader2 className="ml-1.5 h-3 w-3 animate-spin" />
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="timeline"
                  disabled={timelineStatus === 'idle'}
                  className="rounded-lg data-[active]:bg-indigo-600 data-[active]:text-white text-slate-400 transition-all"
                >
                  Timeline
                  {timelineStatus === 'loading' && (
                    <Loader2 className="ml-1.5 h-3 w-3 animate-spin" />
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="validation"
                  disabled={validationStatus === 'idle'}
                  className="rounded-lg data-[active]:bg-indigo-600 data-[active]:text-white text-slate-400 transition-all"
                >
                  Validation
                  {validationStatus === 'loading' && (
                    <Loader2 className="ml-1.5 h-3 w-3 animate-spin" />
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="protocol" className="mt-0 outline-none">
                {protocolStatus === 'loading' && (
                  <div className="space-y-3 mt-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-24 bg-slate-800/50 border border-slate-700/50 rounded-xl relative overflow-hidden flex items-center justify-center">
                        {i === 1 && (
                          <div className="flex flex-col items-center gap-2 text-slate-400">
                            <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                            <span className="text-sm font-medium">Generating protocol from retrieved literature...</span>
                          </div>
                        )}
                        <Skeleton className="absolute inset-0 bg-slate-800/30 opacity-20" />
                      </div>
                    ))}
                  </div>
                )}

                {protocolStatus === 'done' && protocol && (
                  <ProtocolTab steps={protocol} />
                )}

                {protocolStatus === 'error' && (
                  <Alert variant="destructive" className="bg-red-950/20 border-red-900/50 text-red-400 mt-4">
                    <AlertDescription>Protocol generation failed. Please retry.</AlertDescription>
                  </Alert>
                )}
              </TabsContent>

              <TabsContent value="materials" className="mt-0 outline-none">
                {materialsStatus === 'loading' && (
                  <div className="space-y-2 mt-4">
                    {[...Array(6)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full bg-slate-800/50 rounded-lg border border-slate-700/30" />
                    ))}
                  </div>
                )}
                {materialsStatus === 'done' && materials && (
                  <MaterialsTab materials={materials} />
                )}
                {materialsStatus === 'error' && (
                  <p className="text-red-400 text-sm mt-4">
                    Materials generation failed. Please retry.
                  </p>
                )}
              </TabsContent>

              <TabsContent value="budget" className="mt-0 outline-none">
                {budgetStatus === 'loading' && (
                  <div className="space-y-3 mt-4">
                    <div className="grid grid-cols-2 gap-3">
                      {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-20 bg-slate-800/50 rounded-xl border border-slate-700/30" />
                      ))}
                    </div>
                    <Skeleton className="h-12 bg-slate-800/50 rounded-xl border border-slate-700/30" />
                    <Skeleton className="h-32 bg-slate-800/50 rounded-xl border border-slate-700/30" />
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
                  <p className="text-red-400 text-sm mt-4">
                    Budget generation failed. Please retry.
                  </p>
                )}
              </TabsContent>

              <TabsContent value="timeline" className="mt-0 outline-none">
                {timelineStatus === 'loading' && (
                  <div className="space-y-3 mt-4">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-28 bg-slate-800/50 rounded-xl border border-slate-700/30" />
                    ))}
                  </div>
                )}
                {timelineStatus === 'done' && timeline && (
                  <TimelineTab phases={timeline} />
                )}
                {timelineStatus === 'error' && (
                  <p className="text-red-400 text-sm mt-4">
                    Timeline generation failed. Please retry.
                  </p>
                )}
              </TabsContent>

              <TabsContent value="validation" className="mt-0 outline-none">
                {validationStatus === 'loading' && (
                  <div className="space-y-3 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Skeleton className="h-32 bg-slate-800/50 rounded-xl border border-slate-700/30" />
                      <Skeleton className="h-32 bg-slate-800/50 rounded-xl border border-slate-700/30" />
                    </div>
                    <Skeleton className="h-24 bg-slate-800/50 rounded-xl border border-slate-700/30" />
                    <Skeleton className="h-40 bg-slate-800/50 rounded-xl border border-slate-700/30" />
                  </div>
                )}
                {validationStatus === 'done' && validation && (
                  <ValidationTab validation={validation} />
                )}
                {validationStatus === 'error' && (
                  <p className="text-red-400 text-sm mt-4">
                    Validation strategy generation failed. Please retry.
                  </p>
                )}
              </TabsContent>
            </Tabs>

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

            {protocol && materials && budgetStatus === 'done' && (
              <div className="mt-6">
                <ReviewPanel
                  protocol={protocol}
                  materials={materials}
                  parsed={parsed!}
                  onFeedbackSubmitted={(count) => {
                    setFeedbackCount(count)
                  }}
                />
                {feedbackCount > 0 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-green-400 text-xs mt-2"
                  >
                    ✓ {feedbackCount} correction(s) saved — next similar plan will reflect your feedback
                  </motion.p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
