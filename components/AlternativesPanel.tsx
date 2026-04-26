'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, AlertTriangle, DollarSign, ExternalLink, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Material, Alternative, ParsedHypothesis } from '@/lib/types'

interface Props {
  materials: Material[]
  parsed: ParsedHypothesis
  onAlternativesFound: (alts: Alternative[]) => void
}

export default function AlternativesPanel({
  materials,
  parsed,
  onAlternativesFound
}: Props) {
  const [mode, setMode] = useState<'idle' | 'selecting' | 'loading' | 'done'>('idle')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [alternatives, setAlternatives] = useState<Alternative[]>([])

  const expensiveItems = materials.filter(m => m.is_expensive)

  async function searchAlternatives(items: Material[]) {
    setMode('loading')
    try {
      const res = await fetch('/api/generate/alternatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parsed,
          selected_materials: items
        })
      })
      const data: Alternative[] = await res.json()
      setAlternatives(data)
      setMode('done')
    } catch {
      setMode('idle')
    }
  }

  function handleSelectAll() {
    searchAlternatives(expensiveItems)
  }

  function handleChooseMyself() {
    setSelected(new Set())
    setMode('selecting')
  }

  function toggleItem(name: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  function handleSearchSelected() {
    const items = materials.filter(m => selected.has(m.name))
    searchAlternatives(items)
  }

  return (
    <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-amber-500/20">
      <AnimatePresence mode="wait">
        {mode === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="text-amber-400" size={16} />
              <span className="text-amber-300 text-sm font-medium">
                {expensiveItems.length} expensive item(s) detected
              </span>
            </div>
            <p className="text-slate-400 text-xs mb-3">
              Find validated cheaper alternatives from published literature. If no validated substitute exists, we will clearly tell you.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleSelectAll}
                className="bg-amber-600/20 text-amber-300 border border-amber-500/30 rounded-lg px-3 py-1.5 text-xs hover:bg-amber-600/30 transition-colors"
              >
                Find alternatives for expensive items
              </button>
              <button
                onClick={handleChooseMyself}
                className="bg-slate-700 text-slate-300 border border-slate-600 rounded-lg px-3 py-1.5 text-xs hover:bg-slate-600 transition-colors"
              >
                Let me choose items
              </button>
            </div>
          </motion.div>
        )}

        {mode === 'selecting' && (
          <motion.div
            key="selecting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <h3 className="text-slate-300 text-sm font-medium mb-3">Select items to find alternatives for</h3>
            <div className="space-y-1 mb-3">
              {materials.map((m, idx) => (
                <div
                  key={idx}
                  onClick={() => toggleItem(m.name)}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700/50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(m.name)}
                    readOnly
                    className="w-4 h-4 rounded border-slate-500 bg-slate-900 text-indigo-500 focus:ring-indigo-500"
                  />
                  <span className="text-slate-300 text-sm">{m.name}</span>
                  <div className="ml-auto flex items-center gap-2">
                    {m.is_expensive && (
                      <Badge variant="secondary" className="bg-amber-900/50 text-amber-300 border-amber-500/30 text-[10px] py-0 h-4">
                        Expensive
                      </Badge>
                    )}
                    <span className="text-slate-400 text-xs">${m.unit_price_usd}</span>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={handleSearchSelected}
              disabled={selected.size === 0}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Search Alternatives
            </button>
          </motion.div>
        )}

        {mode === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-6"
          >
            <Loader2 className="text-indigo-400 animate-spin mb-2" size={24} />
            <p className="text-slate-400 text-sm mt-2">Searching published literature for validated alternatives...</p>
            <p className="text-slate-500 text-xs mt-1">This may take 15-30 seconds per item</p>
          </motion.div>
        )}

        {mode === 'done' && (
          <motion.div
            key="done"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <h3 className="text-white font-medium mb-4">Alternative Analysis Complete</h3>
            {alternatives.map((alt, idx) => {
              if (!alt.validated) {
                return (
                  <div key={idx} className="bg-red-900/20 border border-red-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="text-red-400 shrink-0" size={16} />
                      <span className="text-red-300 font-medium">{alt.original_material}</span>
                    </div>
                    <div className="bg-red-950/40 border border-red-900/50 rounded-lg p-3">
                      <div className="text-red-300 text-sm font-medium">❌ No alternatives available</div>
                      <div className="text-red-200/70 text-xs mt-1">{alt.no_alternative_reason}</div>
                    </div>
                  </div>
                )
              }

              let confColor = 'bg-slate-800 text-slate-400'
              if (alt.confidence === 'High') confColor = 'bg-green-900/50 text-green-300 border-green-500/30'
              if (alt.confidence === 'Medium') confColor = 'bg-amber-900/50 text-amber-300 border-amber-500/30'

              return (
                <div key={idx} className="bg-green-900/20 border border-green-500/20 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="text-green-400 shrink-0" size={16} />
                      <span className="text-white font-medium">{alt.original_material}</span>
                    </div>
                    <Badge variant="outline" className={`${confColor} text-[10px]`}>
                      {alt.confidence} Confidence
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 mb-3 bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                    <div className="flex-1">
                      <div className="text-slate-400 text-xs mb-1">Original</div>
                      <div className="text-red-400 text-sm">${materials.find(m => m.name === alt.original_material)?.unit_price_usd}</div>
                    </div>
                    <div className="text-slate-500">→</div>
                    <div className="flex-1">
                      <div className="text-slate-400 text-xs mb-1">Alternative</div>
                      <div className="text-white text-sm font-medium">{alt.alternative_name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-green-400 text-sm">${alt.estimated_price_usd}</span>
                        <Badge className="bg-green-600 hover:bg-green-600 text-[10px] py-0 h-4">
                          Save {alt.savings_percent}%
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {alt.reference_title && (
                    <a
                      href={alt.reference_doi.startsWith('10.') ? `https://doi.org/${alt.reference_doi}` : alt.reference_doi}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-1.5 hover:opacity-80 transition-opacity mb-3"
                    >
                      <ExternalLink className="text-slate-400 shrink-0 mt-0.5" size={11} />
                      <span className="text-indigo-400 text-xs">{alt.reference_title}</span>
                    </a>
                  )}

                  {alt.cautionary_notes && alt.cautionary_notes.length > 0 && (
                    <div className="mb-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <AlertTriangle className="text-amber-400" size={13} />
                        <span className="text-amber-300 text-xs font-medium">Cautionary Notes:</span>
                      </div>
                      <ul className="space-y-1 pl-5">
                        {alt.cautionary_notes.map((note, nIdx) => (
                          <li key={nIdx} className="text-amber-300/70 text-xs list-disc">{note}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {alt.protocol_adjustments && alt.protocol_adjustments.length > 0 && (
                    <div className="mb-2">
                      <div className="text-slate-300 text-xs font-medium mt-2 mb-1">Protocol Adjustments Required:</div>
                      <ul className="space-y-1 pl-5">
                        {alt.protocol_adjustments.map((adj, aIdx) => (
                          <li key={aIdx} className="text-slate-300/70 text-xs list-disc">{adj}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {alt.additional_controls && alt.additional_controls.length > 0 && (
                    <div>
                      <div className="text-slate-300 text-xs font-medium mt-2 mb-1">Additional Controls Required:</div>
                      <ul className="space-y-1 pl-5">
                        {alt.additional_controls.map((ctrl, cIdx) => (
                          <li key={cIdx} className="text-slate-300/70 text-xs list-disc">{ctrl}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )
            })}

            {alternatives.some(a => a.validated) && (
              <div className="mt-6 p-4 bg-slate-800 rounded-xl border border-slate-600">
                <p className="text-white text-sm font-medium mb-3">
                  Which plan would you like to proceed with?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => onAlternativesFound([])}
                    className="flex-1 py-2 px-4 rounded-lg border border-slate-500 text-slate-300 text-sm hover:bg-slate-700 transition"
                  >
                    Keep Original Plan
                  </button>
                  <button
                    onClick={() => onAlternativesFound(alternatives)}
                    className="flex-1 py-2 px-4 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-500 transition font-medium"
                  >
                    Switch to Alternative Plan
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
