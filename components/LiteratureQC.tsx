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
    badgeClass = 'text-[#4A6B4C] bg-[#EBF0EB] border-[#7C9A7E]'
    borderClass = 'border-[#7C9A7E]'
  } else if (result.novelty_signal === 'similar_exists') {
    badge = 'Similar Work Exists'
    badgeClass = 'text-[#A67C52] bg-[#FBF5EC] border-[#D4B896]'
    borderClass = 'border-[#D4B896]'
  } else {
    badge = '⚠ Possible Duplicate'
    badgeClass = 'text-[#8B4545] bg-[#FBF0F0] border-[#D4A0A0]'
    borderClass = 'border-[#D4A0A0]'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className={`bg-white border-[#DDD8CF] shadow-sm ${borderClass}`}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center space-x-2 text-[#2C2C2C]">
            <BookOpen className="w-5 h-5" />
            <CardTitle className="text-lg">Literature QC</CardTitle>
          </div>
          <Badge variant="outline" className={badgeClass}>
            {badge}
          </Badge>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-[#2C2C2C] text-sm mb-4">
            {result.explanation}
          </p>

          {result.references && result.references.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-[#5C5C5C] text-xs font-semibold uppercase tracking-wider">
                Relevant Papers
              </h4>
              {result.references.map((ref, idx) => (
                <div key={idx} className="bg-[#F7F4EF] rounded-lg p-3 border border-[#E8E3DA]">
                  <h5 className="text-[#2C2C2C] font-medium text-sm mb-1">{ref.title}</h5>
                  <p className="text-[#5C5C5C] text-xs mb-2">
                    {ref.authors} · {ref.year}
                  </p>
                  <p className="text-[#5C5C5C] italic text-xs mb-2">
                    {ref.relevance}
                  </p>
                  {ref.doi && ref.doi !== 'No DOI' && (
                    <a
                      href={`https://doi.org/${ref.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-[#4A6B4C] hover:underline text-xs font-medium"
                    >
                      View Paper <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {result.source === 'fallback' && (
            <p className="text-[#8C8C8C] italic text-xs mt-4">
              Literature search unavailable — plan generation continues
            </p>
          )}

          <div className="text-[#8C8C8C] text-xs mt-4 pt-3 border-t border-[#E8E3DA]">
            Powered by Semantic Scholar
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
