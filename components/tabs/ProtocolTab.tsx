'use client'
import { motion } from 'framer-motion'
import { Clock, AlertTriangle, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ProtocolStep } from '@/lib/types'

interface Props { steps: ProtocolStep[] }

export default function ProtocolTab({ steps }: Props) {
  return (
    <div className="space-y-3 mt-4">
      {steps.map((step, i) => (
        <motion.div
          key={step.step_number}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="bg-white rounded-xl p-4 border border-[#DDD8CF] shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#7C9A7E] flex items-center justify-center text-white text-xs font-bold shadow-sm">
                {String(step.step_number).padStart(2, '0')}
              </div>
              <h4 className="font-[family-name:var(--font-serif)] text-[#2C2C2C] font-medium text-base">{step.title}</h4>
            </div>
            {step.duration && (
              <Badge variant="secondary" className="bg-[#EEE9E0] hover:bg-[#DDD8CF] text-[#5C5C5C] flex items-center shrink-0 ml-4 py-1 border border-[#DDD8CF]">
                <Clock className="w-3 h-3 mr-1.5" />
                <span className="text-xs">{step.duration}</span>
              </Badge>
            )}
          </div>

          <div className="mt-3 pl-11">
            <p className="text-[#2C2C2C] text-sm leading-relaxed">
              {step.description}
            </p>

            {step.critical_note && (
              <div className="mt-3 flex items-start gap-2 bg-[#FBF5EC] rounded-lg p-2.5 border border-[#D4B896]">
                <AlertTriangle className="w-4 h-4 text-[#A67C52] shrink-0 mt-0.5" />
                <p className="text-[#A67C52] text-xs italic leading-relaxed">
                  {step.critical_note}
                </p>
              </div>
            )}

            {step.source_protocol && (
              <div className="mt-3 flex items-center gap-1.5 text-[#8C8C8C] hover:text-[#5C5C5C] transition-colors w-fit">
                <ExternalLink className="w-3 h-3" />
                {step.source_protocol.startsWith('http') ? (
                  <a
                    href={step.source_protocol}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs hover:underline decoration-[#8C8C8C]/50 underline-offset-2"
                  >
                    Adapted from: {step.source_protocol.length > 50 ? step.source_protocol.substring(0, 50) + '...' : step.source_protocol}
                  </a>
                ) : (
                  <span className="text-xs">Adapted from: {step.source_protocol}</span>
                )}
              </div>
            )}
          </div>
        </motion.div>
      ))}

      <p className="text-[#8C8C8C] text-xs text-center mt-6 pt-4 border-t border-[#E8E3DA]">
        Protocol grounded in published methodologies via protocols.io and peer-reviewed literature
      </p>
    </div>
  )
}
