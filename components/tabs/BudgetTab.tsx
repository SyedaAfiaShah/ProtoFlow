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
        <Card className="bg-white border-[#DDD8CF] rounded-xl shadow-sm">
          <CardContent className="p-4 flex flex-col justify-center items-center h-full">
            <FlaskConical className="w-6 h-6 text-[#7C9A7E] mb-2" />
            <div className="text-[#5C5C5C] text-xs mb-1">Materials</div>
            <div className="text-[#2C2C2C] font-bold text-lg">{formatCurrency(budget.materials_total)}</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#DDD8CF] rounded-xl shadow-sm">
          <CardContent className="p-4 flex flex-col justify-center items-center h-full">
            <Building2 className="w-6 h-6 text-[#4A6B4C] mb-2" />
            <div className="text-[#5C5C5C] text-xs mb-1">Equipment</div>
            <div className="text-[#2C2C2C] font-bold text-lg">{formatCurrency(budget.equipment_cost)}</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#DDD8CF] rounded-xl shadow-sm">
          <CardContent className="p-4 flex flex-col justify-center items-center h-full">
            <Users className="w-6 h-6 text-[#7C9A7E] mb-2" />
            <div className="text-[#5C5C5C] text-xs mb-1">Personnel</div>
            <div className="text-[#2C2C2C] font-bold text-lg">{formatCurrency(budget.personnel_cost)}</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#DDD8CF] rounded-xl shadow-sm">
          <CardContent className="p-4 flex flex-col justify-center items-center h-full">
            <DollarSign className="w-6 h-6 text-[#5C5C5C] mb-2" />
            <div className="text-[#5C5C5C] text-xs mb-1">Indirect</div>
            <div className="text-[#2C2C2C] font-bold text-lg">{formatCurrency(budget.indirect_cost)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Total Section */}
      <div className="bg-[#EBF0EB] border border-[#7C9A7E] rounded-xl p-4 flex justify-between items-center">
        <span className="text-[#2C2C2C] font-medium">Total Estimated Budget</span>
        <span className="text-[#2C2C2C] text-2xl font-bold text-right">{formatCurrency(budget.total)}</span>
      </div>

      {/* Breakdown Table */}
      <div>
        <h3 className="font-[family-name:var(--font-serif)] text-[#2C2C2C] font-medium mt-6 mb-3">Cost Breakdown</h3>
        <div className="overflow-x-auto rounded-xl border border-[#DDD8CF] shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#EEE9E0] text-[#5C5C5C] text-xs uppercase tracking-wider">
                <th className="p-3 font-medium w-1/4">Category</th>
                <th className="p-3 font-medium w-1/2">Item</th>
                <th className="p-3 font-medium text-right w-1/4">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E3DA]">
              {budget.breakdown.map((line, idx) => {
                const showCategory = idx === 0 || line.category !== budget.breakdown[idx - 1].category

                let badgeColor = ''
                switch (line.category) {
                  case 'Materials':
                    badgeColor = 'bg-[#EBF0EB] text-[#4A6B4C] border-[#7C9A7E]'
                    break
                  case 'Equipment':
                    badgeColor = 'bg-[#EBF0EB] text-[#4A6B4C] border-[#7C9A7E]'
                    break
                  case 'Personnel':
                    badgeColor = 'bg-[#EEE9E0] text-[#5C5C5C] border-[#DDD8CF]'
                    break
                  case 'Indirect':
                    badgeColor = 'bg-[#EEE9E0] text-[#8C8C8C] border-[#DDD8CF]'
                    break
                }

                return (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]'}>
                    <td className="p-3 align-top">
                      {showCategory && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${badgeColor}`}>
                          {line.category}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-[#2C2C2C] text-sm">
                      {line.item}
                    </td>
                    <td className="p-3 text-[#2C2C2C] text-sm text-right font-mono">
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
      <p className="text-[#8C8C8C] text-xs mt-4 italic text-center">
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
