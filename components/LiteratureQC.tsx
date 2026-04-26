'use client'
import { motion } from 'framer-motion'
import { ExternalLink, BookOpen } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LiteratureResult } from '@/lib/types'

interface Props { result: LiteratureResult }

export default function LiteratureQC({ result }: Props) {
  let badge = ''
  let badgeClass = ''
  let borderClass = ''

  if (result.novelty_signal === 'not_found') {
    badge = '✓ Novel Research'
    badgeClass = 'text-green-400 bg-green-950 border-green-500/30'
    borderClass = 'border-green-500/30'
  } else if (result.novelty_signal === 'similar_exists') {
    badge = 'Similar Work Exists'
    badgeClass = 'text-amber-400 bg-amber-950 border-amber-500/30'
    borderClass = 'border-amber-500/30'
  } else {
    badge = '⚠ Possible Duplicate'
    badgeClass = 'text-red-400 bg-red-950 border-red-500/30'
    borderClass = 'border-red-500/30'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className={`bg-[#111827] border-slate-700/50 ${borderClass}`}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center space-x-2 text-white">
            <BookOpen className="w-5 h-5" />
            <CardTitle className="text-lg">Literature QC</CardTitle>
          </div>
          <Badge variant="outline" className={badgeClass}>
            {badge}
          </Badge>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-slate-300 text-sm mb-4">
            {result.explanation}
          </p>

          {result.references && result.references.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                Relevant Papers
              </h4>
              {result.references.map((ref, idx) => (
                <div key={idx} className="bg-slate-800/50 rounded-lg p-3">
                  <h5 className="text-white font-medium text-sm mb-1">{ref.title}</h5>
                  <p className="text-slate-400 text-xs mb-2">
                    {ref.authors} · {ref.year}
                  </p>
                  <p className="text-slate-400 italic text-xs mb-2">
                    {ref.relevance}
                  </p>
                  {ref.doi && ref.doi !== 'No DOI' && (
                    <a
                      href={`https://doi.org/${ref.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-indigo-400 hover:underline text-xs"
                    >
                      View Paper <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {result.source === 'fallback' && (
            <p className="text-slate-500 italic text-xs mt-4">
              Literature search unavailable — plan generation continues
            </p>
          )}

          <div className="text-slate-600 text-xs mt-4 pt-3 border-t border-slate-800/50">
            Powered by Semantic Scholar
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
