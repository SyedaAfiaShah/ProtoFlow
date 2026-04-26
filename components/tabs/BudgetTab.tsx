'use client'
import { DollarSign, FlaskConical, Users, Building2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Budget, Material, ParsedHypothesis, Alternative } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import AlternativesPanel from '@/components/AlternativesPanel'

interface Props {
  budget: Budget
  parsed: ParsedHypothesis
  materials: Material[]
  onAlternativesFound: (alts: Alternative[]) => void
  alternatives: Alternative[]
}

export default function BudgetTab({ budget, parsed, materials, onAlternativesFound }: Props) {
  return (
    <div className="space-y-6 mt-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-4 flex flex-col justify-center items-center h-full">
            <FlaskConical className="w-6 h-6 text-indigo-400 mb-2" />
            <div className="text-slate-400 text-xs mb-1">Materials</div>
            <div className="text-white font-bold text-lg">{formatCurrency(budget.materials_total)}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-4 flex flex-col justify-center items-center h-full">
            <Building2 className="w-6 h-6 text-violet-400 mb-2" />
            <div className="text-slate-400 text-xs mb-1">Equipment</div>
            <div className="text-white font-bold text-lg">{formatCurrency(budget.equipment_cost)}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-4 flex flex-col justify-center items-center h-full">
            <Users className="w-6 h-6 text-blue-400 mb-2" />
            <div className="text-slate-400 text-xs mb-1">Personnel</div>
            <div className="text-white font-bold text-lg">{formatCurrency(budget.personnel_cost)}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-4 flex flex-col justify-center items-center h-full">
            <DollarSign className="w-6 h-6 text-slate-400 mb-2" />
            <div className="text-slate-400 text-xs mb-1">Indirect</div>
            <div className="text-white font-bold text-lg">{formatCurrency(budget.indirect_cost)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Total Section */}
      <div className="bg-gradient-to-r from-indigo-900/40 to-violet-900/40 border border-indigo-500/30 rounded-xl p-4 flex justify-between items-center">
        <span className="text-white font-medium">Total Estimated Budget</span>
        <span className="text-white text-2xl font-bold text-right">{formatCurrency(budget.total)}</span>
      </div>

      {/* Breakdown Table */}
      <div>
        <h3 className="text-slate-300 font-medium mt-6 mb-3">Cost Breakdown</h3>
        <div className="overflow-x-auto rounded-xl border border-slate-700/50">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                <th className="p-3 font-medium w-1/4">Category</th>
                <th className="p-3 font-medium w-1/2">Item</th>
                <th className="p-3 font-medium text-right w-1/4">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {budget.breakdown.map((line, idx) => {
                const showCategory = idx === 0 || line.category !== budget.breakdown[idx - 1].category
                
                let badgeColor = ''
                  switch (line.category) {
                    case 'Materials':
                      badgeColor = 'bg-indigo-900/50 text-indigo-300 border-indigo-500/30'
                      break
                    case 'Equipment':
                      badgeColor = 'bg-violet-900/50 text-violet-300 border-violet-500/30'
                      break
                    case 'Personnel':
                      badgeColor = 'bg-blue-900/50 text-blue-300 border-blue-500/30'
                      break
                    case 'Indirect':
                      badgeColor = 'bg-slate-800 text-slate-400 border-slate-700/50'
                      break
                  }

                  return (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-slate-800/10' : 'bg-slate-800/30'}>
                      <td className="p-3 align-top">
                        {showCategory && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${badgeColor}`}>
                            {line.category}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-300 text-sm">
                        {line.item}
                      </td>
                      <td className="p-3 text-slate-300 text-sm text-right font-mono">
                        {formatCurrency(line.cost_usd)}
                      </td>
                    </tr>
                  )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-slate-600 text-xs mt-4 italic text-center">
        {budget.disclaimer}
      </p>

      {materials.some(m => m.is_expensive) && (
        <div className="mt-6">
          <AlternativesPanel
            materials={materials}
            parsed={parsed}
            onAlternativesFound={onAlternativesFound}
          />
        </div>
      )}
    </div>
  )
}
