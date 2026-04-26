'use client'
import { ExternalLink, AlertTriangle, DollarSign } from 'lucide-react'
import { Material } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'

interface Props {
  materials: Material[]
}

export default function MaterialsTab({ materials }: Props) {
  const total = materials.reduce(
    (sum, m) => sum + (m.unit_price_usd * m.quantity), 
    0
  )
  const expensiveItems = materials.filter(m => m.is_expensive)

  return (
    <div className="space-y-4 mt-4">
      <div className="overflow-x-auto rounded-xl border border-slate-700/50">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800 text-slate-400 text-xs uppercase tracking-wider">
              <th className="p-3 font-medium">Material</th>
              <th className="p-3 font-medium">Catalog #</th>
              <th className="p-3 font-medium text-center">Qty</th>
              <th className="p-3 font-medium">Unit</th>
              <th className="p-3 font-medium text-right">Est. Price</th>
              <th className="p-3 font-medium">Storage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {materials.map((material, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-slate-800/10' : 'bg-slate-800/30'}>
                <td className="p-3">
                  <div className="text-white text-sm font-medium">{material.name}</div>
                  <div className="flex gap-2 mt-1">
                    {material.verify_catalog && (
                      <span className="inline-flex items-center text-[10px] text-amber-400 bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-500/30">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        verify
                      </span>
                    )}
                    {material.is_expensive && (
                      <span className="inline-flex items-center text-[10px] text-amber-400 bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-500/30">
                        <DollarSign className="w-3 h-3 mr-0.5" />
                        Expensive
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-3">
                  <a href={material.supplier_url} 
                     target="_blank"
                     rel="noopener noreferrer"
                     className="font-mono text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 w-max">
                    {material.catalog_number}
                    <ExternalLink size={10} />
                  </a>
                </td>
                <td className="p-3 text-slate-300 text-sm text-center">{material.quantity}</td>
                <td className="p-3 text-slate-400 text-sm">{material.unit}</td>
                <td className={`p-3 text-sm text-right ${material.is_expensive ? 'text-amber-400' : 'text-slate-300'}`}>
                  {formatCurrency(material.unit_price_usd)}
                </td>
                <td className="p-3 text-slate-400 text-xs">{material.storage}</td>
              </tr>
            ))}
            <tr className="bg-slate-800 border-t border-slate-600">
              <td colSpan={4} className="p-3 text-slate-300 font-medium text-right">
                Total (estimated)
              </td>
              <td className="p-3 text-white font-bold text-right">
                {formatCurrency(total)}
              </td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-slate-600 text-xs mt-3 italic">
        Prices are estimates. Click catalog numbers to verify current pricing on Sigma-Aldrich.
      </p>

      {expensiveItems.length > 0 && (
        <div className="mt-4 p-4 bg-slate-800/50 rounded-xl border border-amber-500/20">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="text-amber-400" size={16} />
            <span className="text-amber-300 text-sm font-medium">
              {expensiveItems.length} expensive item(s) detected
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            See the alternatives panel below the plan.
          </p>
        </div>
      )}
    </div>
  )
}
