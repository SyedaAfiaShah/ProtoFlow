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
          className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-indigo-900/50">
                {String(step.step_number).padStart(2, '0')}
              </div>
              <h4 className="text-white font-medium text-base">{step.title}</h4>
            </div>
            {step.duration && (
              <Badge variant="secondary" className="bg-slate-700 hover:bg-slate-600 text-slate-300 flex items-center shrink-0 ml-4 py-1">
                <Clock className="w-3 h-3 mr-1.5" />
                <span className="text-xs">{step.duration}</span>
              </Badge>
            )}
          </div>

          <div className="mt-3 pl-11">
            <p className="text-slate-300 text-sm leading-relaxed">
              {step.description}
            </p>

            {step.critical_note && (
              <div className="mt-3 flex items-start gap-2 bg-amber-500/10 rounded-lg p-2.5 border border-amber-500/20">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-amber-300 text-xs italic leading-relaxed">
                  {step.critical_note}
                </p>
              </div>
            )}

            {step.source_protocol && (
              <div className="mt-3 flex items-center gap-1.5 text-slate-500 hover:text-slate-400 transition-colors w-fit">
                <ExternalLink className="w-3 h-3" />
                {step.source_protocol.startsWith('http') ? (
                  <a
                    href={step.source_protocol}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs hover:underline decoration-slate-500/50 underline-offset-2"
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

      <p className="text-slate-600 text-xs text-center mt-6 pt-4 border-t border-slate-800/50">
        Protocol grounded in published methodologies via protocols.io and peer-reviewed literature
      </p>
    </div>
  )
}
