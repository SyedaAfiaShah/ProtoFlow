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
        <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="text-green-400" size={18} />
            <h3 className="text-green-300 font-medium">Success Criteria</h3>
          </div>
          <ul className="space-y-2">
            {validation.success_criteria.map((criterion, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">•</span>
                <span className="text-slate-300 text-sm">{criterion}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right card — Failure Criteria */}
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <XCircle className="text-red-400" size={18} />
            <h3 className="text-red-300 font-medium">Failure Criteria</h3>
          </div>
          <ul className="space-y-2">
            {validation.failure_criteria.map((criterion, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">✕</span>
                <span className="text-slate-300 text-sm">{criterion}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        {/* Left card — Statistical Test */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="text-indigo-400" size={16} />
            <span className="text-slate-400 text-xs">Statistical Test</span>
          </div>
          <div className="text-white text-sm font-medium mt-1">
            {validation.statistical_test}
          </div>
        </div>

        {/* Right card — Sample Size */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <FlaskConical className="text-violet-400" size={16} />
            <span className="text-slate-400 text-xs">Sample Size</span>
          </div>
          <div className="text-white text-sm font-medium mt-1">
            {validation.sample_size}
          </div>
        </div>
      </div>

      {/* CONTROLS TABLE */}
      <div>
        <h3 className="text-slate-300 font-medium mb-3">Experimental Controls</h3>
        <div className="overflow-x-auto rounded-xl border border-slate-700/50">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                <th className="p-3 font-medium w-1/4">Type</th>
                <th className="p-3 font-medium w-3/4">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {validation.controls.map((control, idx) => {
                let badgeClass = ''
                let label = ''
                switch (control.type) {
                  case 'positive':
                    badgeClass = 'bg-green-900/50 text-green-300 border-green-500/30'
                    label = 'Positive'
                    break
                  case 'negative':
                    badgeClass = 'bg-red-900/50 text-red-300 border-red-500/30'
                    label = 'Negative'
                    break
                  case 'technical':
                    badgeClass = 'bg-slate-800 text-slate-400 border-slate-700/50'
                    label = 'Technical'
                    break
                }
                return (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-slate-800/10' : 'bg-slate-800/30'}>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${badgeClass}`}>
                        {label}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300 text-sm">
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
        <h3 className="text-slate-300 font-medium mb-3">QC Checkpoints</h3>
        <ul className="space-y-3">
          {validation.qc_checkpoints.map((checkpoint, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-indigo-900/50 mt-0.5">
                {idx + 1}
              </div>
              <span className="text-slate-300 text-sm leading-relaxed">{checkpoint}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* STANDARD APPLIED */}
      <div className="mt-4 p-3 bg-slate-800/30 rounded-lg flex items-center gap-2">
        <Shield className="text-slate-400" size={14} />
        <span className="text-slate-500 text-xs italic">
          Standard applied: {validation.standard_applied}
        </span>
      </div>

    </div>
  )
}
