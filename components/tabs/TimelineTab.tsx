'use client'
import { motion } from 'framer-motion'
import { CheckCircle2, Clock, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { TimelinePhase } from '@/lib/types'

interface Props { phases: TimelinePhase[] }

export default function TimelineTab({ phases }: Props) {
  const totalWeeks = phases.reduce((sum, p) => sum + p.duration_weeks, 0)

  return (
    <div className="space-y-3 mt-4">
      <div className="mb-4 p-4 bg-[#EBF0EB] border border-[#7C9A7E] rounded-xl flex items-center justify-between">
        <div>
          <p className="text-[#5C5C5C] text-xs">Total Estimated Duration</p>
          <p className="text-[#2C2C2C] text-2xl font-bold mt-0.5">{totalWeeks} weeks</p>
        </div>
        <div className="text-right">
          <p className="text-[#5C5C5C] text-xs">{phases.length} phases</p>
          <p className="text-[#2C2C2C] text-sm mt-0.5">{(totalWeeks / 4).toFixed(1)} months</p>
        </div>
      </div>
      {phases.map((phase, i) => (
        <motion.div
          key={phase.phase_number}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="bg-white rounded-xl p-4 border border-[#DDD8CF] shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#7C9A7E] flex items-center justify-center text-white text-xs font-bold shadow-sm">
                {phase.phase_number}
              </div>
              <h4 className="text-[#2C2C2C] font-medium text-base">{phase.phase_name}</h4>
            </div>
            <Badge variant="secondary" className="bg-[#EEE9E0] text-[#5C5C5C] border border-[#DDD8CF] flex items-center shrink-0 ml-4 py-1">
              <Clock className="w-3 h-3 mr-1.5" />
              <span className="text-xs">{phase.duration_weeks} week(s)</span>
            </Badge>
          </div>

          <div className="mt-3 pl-11">
            <ul className="space-y-1">
              {phase.tasks.map((task, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#7C9A7E] mt-1.5 shrink-0" />
                  <span className="text-[#2C2C2C] text-sm">{task}</span>
                </li>
              ))}
            </ul>

            {phase.dependencies && phase.dependencies.length > 0 && (
              <div className="mt-2 flex items-center gap-1">
                <ArrowRight className="text-[#8C8C8C]" size={12} />
                <span className="text-[#8C8C8C] text-xs italic">
                  Requires: {phase.dependencies.join(', ')}
                </span>
              </div>
            )}

            <div className="mt-3 flex items-center gap-2">
              <CheckCircle2 className="text-[#4A6B4C]" size={14} />
              <span className="text-[#4A6B4C] text-xs font-medium">
                Milestone: {phase.milestone}
              </span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
