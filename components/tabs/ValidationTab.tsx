'use client'
import { CheckCircle2, XCircle, FlaskConical, BarChart3, Shield } from 'lucide-react'
import { ValidationStrategy } from '@/lib/types'

interface Props { validation: ValidationStrategy }

export default function ValidationTab({ validation }: Props) {
  return (
    <div className="space-y-6 mt-4">

      {/* TWO COLUMN GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left card — Success Criteria */}
        <div className="bg-[#EBF0EB] border border-[#7C9A7E] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="text-[#4A6B4C]" size={18} />
            <h3 className="font-[family-name:var(--font-serif)] text-[#4A6B4C] font-medium">Success Criteria</h3>
          </div>
          <ul className="space-y-2">
            {validation.success_criteria.map((criterion, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-[#4A6B4C] mt-0.5">•</span>
                <span className="text-[#2C2C2C] text-sm">{criterion}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right card — Failure Criteria */}
        <div className="bg-[#FBF0F0] border border-[#D4A0A0] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <XCircle className="text-[#8B4545]" size={18} />
            <h3 className="font-[family-name:var(--font-serif)] text-[#8B4545] font-medium">Failure Criteria</h3>
          </div>
          <ul className="space-y-2">
            {validation.failure_criteria.map((criterion, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-[#8B4545] mt-0.5">✕</span>
                <span className="text-[#2C2C2C] text-sm">{criterion}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        {/* Left card — Statistical Test */}
        <div className="bg-white border border-[#DDD8CF] rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="text-[#7C9A7E]" size={16} />
            <span className="text-[#5C5C5C] text-xs">Statistical Test</span>
          </div>
          <div className="text-[#2C2C2C] text-sm font-medium mt-1">
            {validation.statistical_test}
          </div>
        </div>

        {/* Right card — Sample Size */}
        <div className="bg-white border border-[#DDD8CF] rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <FlaskConical className="text-[#4A6B4C]" size={16} />
            <span className="text-[#5C5C5C] text-xs">Sample Size</span>
          </div>
          <div className="text-[#2C2C2C] text-sm font-medium mt-1">
            {validation.sample_size}
          </div>
        </div>
      </div>

      {/* CONTROLS TABLE */}
      <div>
        <h3 className="font-[family-name:var(--font-serif)] text-[#2C2C2C] font-medium mb-3">Experimental Controls</h3>
        <div className="overflow-x-auto rounded-xl border border-[#DDD8CF] shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#EEE9E0] text-[#5C5C5C] text-xs uppercase tracking-wider">
                <th className="p-3 font-medium w-1/4">Type</th>
                <th className="p-3 font-medium w-3/4">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E3DA]">
              {validation.controls.map((control, idx) => {
                let badgeClass = ''
                let label = ''
                switch (control.type) {
                  case 'positive':
                    badgeClass = 'bg-[#EBF0EB] text-[#4A6B4C] border-[#7C9A7E]'
                    label = 'Positive'
                    break
                  case 'negative':
                    badgeClass = 'bg-[#FBF0F0] text-[#8B4545] border-[#D4A0A0]'
                    label = 'Negative'
                    break
                  case 'technical':
                    badgeClass = 'bg-[#EEE9E0] text-[#5C5C5C] border-[#DDD8CF]'
                    label = 'Technical'
                    break
                }
                return (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]'}>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${badgeClass}`}>
                        {label}
                      </span>
                    </td>
                    <td className="p-3 text-[#2C2C2C] text-sm">
                      {control.description}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* QC CHECKPOINTS */}
      <div>
        <h3 className="font-[family-name:var(--font-serif)] text-[#2C2C2C] font-medium mb-3">QC Checkpoints</h3>
        <ul className="space-y-3">
          {validation.qc_checkpoints.map((checkpoint, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#7C9A7E] flex items-center justify-center text-white text-xs font-bold shadow-sm mt-0.5">
                {idx + 1}
              </div>
              <span className="text-[#2C2C2C] text-sm leading-relaxed">{checkpoint}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* STANDARD APPLIED */}
      <div className="mt-4 p-3 bg-[#EEE9E0] rounded-lg flex items-center gap-2 border border-[#DDD8CF]">
        <Shield className="text-[#5C5C5C]" size={14} />
        <span className="text-[#8C8C8C] text-xs italic">
          Standard applied: {validation.standard_applied}
        </span>
      </div>

    </div>
  )
}
