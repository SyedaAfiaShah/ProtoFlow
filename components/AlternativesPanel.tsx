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
    <div className="mt-6 p-4 bg-[#FBF5EC] rounded-xl border border-[#D4B896]">
      <AnimatePresence mode="wait">
        {mode === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="text-[#A67C52]" size={16} />
              <span className="text-[#A67C52] text-sm font-medium">
                {expensiveItems.length} expensive item(s) detected
              </span>
            </div>
            <p className="text-[#5C5C5C] text-xs mb-3">
              Find validated cheaper alternatives from published literature. If no validated substitute exists, we will clearly tell you.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleSelectAll}
                className="bg-[#FBF5EC] text-[#A67C52] border border-[#D4B896] rounded-lg px-3 py-1.5 text-xs hover:bg-[#D4B896]/20 transition-colors"
              >
                Find alternatives for expensive items
              </button>
              <button
                onClick={handleChooseMyself}
                className="bg-[#EEE9E0] text-[#2C2C2C] border border-[#DDD8CF] rounded-lg px-3 py-1.5 text-xs hover:bg-[#DDD8CF] transition-colors"
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
            <h3 className="text-[#2C2C2C] text-sm font-medium mb-3">Select items to find alternatives for</h3>
            <div className="space-y-1 mb-3">
              {materials.map((m, idx) => (
                <div
                  key={idx}
                  onClick={() => toggleItem(m.name)}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#EEE9E0] cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(m.name)}
                    readOnly
                    className="w-4 h-4 rounded border-[#DDD8CF] bg-white text-[#7C9A7E] focus:ring-[#7C9A7E]"
                  />
                  <span className="text-[#2C2C2C] text-sm">{m.name}</span>
                  <div className="ml-auto flex items-center gap-2">
                    {m.is_expensive && (
                      <Badge variant="secondary" className="bg-[#FBF5EC] text-[#A67C52] border-[#D4B896] text-[10px] py-0 h-4">
                        Expensive
                      </Badge>
                    )}
                    <span className="text-[#5C5C5C] text-xs">${m.unit_price_usd}</span>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={handleSearchSelected}
              disabled={selected.size === 0}
              className="bg-[#7C9A7E] hover:bg-[#6B8A6D] text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
            <Loader2 className="text-[#7C9A7E] animate-spin mb-2" size={24} />
            <p className="text-[#5C5C5C] text-sm mt-2">Searching published literature for validated alternatives...</p>
            <p className="text-[#8C8C8C] text-xs mt-1">This may take 15-30 seconds per item</p>
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
            <h3 className="text-[#2C2C2C] font-medium mb-4">Alternative Analysis Complete</h3>
            {alternatives.map((alt, idx) => {
              if (!alt.validated) {
                return (
                  <div key={idx} className="bg-[#FBF0F0] border border-[#D4A0A0] rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="text-[#8B4545] shrink-0" size={16} />
                      <span className="text-[#8B4545] font-medium">{alt.original_material}</span>
                    </div>
                    <div className="bg-[#FBF0F0] border border-[#D4A0A0] rounded-lg p-3">
                      <div className="text-[#8B4545] text-sm font-medium">❌ No alternatives available</div>
                      <div className="text-[#8B4545]/70 text-xs mt-1">{alt.no_alternative_reason}</div>
                    </div>
                  </div>
                )
              }

              let confColor = 'bg-[#EEE9E0] text-[#5C5C5C] border-[#DDD8CF]'
              if (alt.confidence === 'High') confColor = 'bg-[#EBF0EB] text-[#4A6B4C] border-[#7C9A7E]'
              if (alt.confidence === 'Medium') confColor = 'bg-[#FBF5EC] text-[#A67C52] border-[#D4B896]'

              return (
                <div key={idx} className="bg-[#EBF0EB] border border-[#7C9A7E] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="text-[#4A6B4C] shrink-0" size={16} />
                      <span className="text-[#2C2C2C] font-medium">{alt.original_material}</span>
                    </div>
                    <Badge variant="outline" className={`${confColor} text-[10px]`}>
                      {alt.confidence} Confidence
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 mb-3 bg-white p-3 rounded-lg border border-[#DDD8CF]">
                    <div className="flex-1">
                      <div className="text-[#5C5C5C] text-xs mb-1">Original</div>
                      <div className="text-[#8B4545] text-sm">${materials.find(m => m.name === alt.original_material)?.unit_price_usd}</div>
                    </div>
                    <div className="text-[#8C8C8C]">→</div>
                    <div className="flex-1">
                      <div className="text-[#5C5C5C] text-xs mb-1">Alternative</div>
                      <div className="text-[#2C2C2C] text-sm font-medium">{alt.alternative_name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[#4A6B4C] text-sm">${alt.estimated_price_usd}</span>
                        <Badge className="bg-[#7C9A7E] hover:bg-[#6B8A6D] text-white text-[10px] py-0 h-4">
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
                      <ExternalLink className="text-[#5C5C5C] shrink-0 mt-0.5" size={11} />
                      <span className="text-[#4A6B4C] text-xs font-medium">{alt.reference_title}</span>
                    </a>
                  )}

                  {alt.cautionary_notes && alt.cautionary_notes.length > 0 && (
                    <div className="mb-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <AlertTriangle className="text-[#A67C52]" size={13} />
                        <span className="text-[#A67C52] text-xs font-medium">Cautionary Notes:</span>
                      </div>
                      <ul className="space-y-1 pl-5">
                        {alt.cautionary_notes.map((note, nIdx) => (
                          <li key={nIdx} className="text-[#A67C52]/80 text-xs list-disc">{note}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {alt.protocol_adjustments && alt.protocol_adjustments.length > 0 && (
                    <div className="mb-2">
                      <div className="text-[#2C2C2C] text-xs font-medium mt-2 mb-1">Protocol Adjustments Required:</div>
                      <ul className="space-y-1 pl-5">
                        {alt.protocol_adjustments.map((adj, aIdx) => (
                          <li key={aIdx} className="text-[#5C5C5C] text-xs list-disc">{adj}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {alt.additional_controls && alt.additional_controls.length > 0 && (
                    <div>
                      <div className="text-[#2C2C2C] text-xs font-medium mt-2 mb-1">Additional Controls Required:</div>
                      <ul className="space-y-1 pl-5">
                        {alt.additional_controls.map((ctrl, cIdx) => (
                          <li key={cIdx} className="text-[#5C5C5C] text-xs list-disc">{ctrl}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )
            })}

            {alternatives.some(a => a.validated) && (
              <div className="mt-6 p-4 bg-white rounded-xl border border-[#DDD8CF] shadow-sm">
                <p className="text-[#2C2C2C] text-sm font-medium mb-3">
                  Which plan would you like to proceed with?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => onAlternativesFound([])}
                    className="flex-1 py-2 px-4 rounded-lg border border-[#DDD8CF] text-[#2C2C2C] text-sm hover:bg-[#EEE9E0] transition"
                  >
                    Keep Original Plan
                  </button>
                  <button
                    onClick={() => onAlternativesFound(alternatives)}
                    className="flex-1 py-2 px-4 rounded-lg bg-[#7C9A7E] text-white text-sm hover:bg-[#6B8A6D] transition font-medium"
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
