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
      <div className="overflow-x-auto rounded-xl border border-[#DDD8CF] shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#EEE9E0] text-[#5C5C5C] text-xs uppercase tracking-wider">
              <th className="p-3 font-medium">Material</th>
              <th className="p-3 font-medium">Catalog #</th>
              <th className="p-3 font-medium text-center">Qty</th>
              <th className="p-3 font-medium">Unit</th>
              <th className="p-3 font-medium text-right">Est. Price</th>
              <th className="p-3 font-medium">Storage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E3DA]">
            {materials.map((material, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]'}>
                <td className="p-3">
                  <div className="text-[#2C2C2C] text-sm font-medium">{material.name}</div>
                  <div className="flex gap-2 mt-1">
                    {material.verify_catalog && (
                      <span className="inline-flex items-center text-[10px] text-[#A67C52] bg-[#FBF5EC] px-1.5 py-0.5 rounded border border-[#D4B896]">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        verify
                      </span>
                    )}
                    {material.is_expensive && (
                      <span className="inline-flex items-center text-[10px] text-[#A67C52] bg-[#FBF5EC] px-1.5 py-0.5 rounded border border-[#D4B896]">
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
                     className="font-mono text-xs text-[#4A6B4C] hover:text-[#7C9A7E] flex items-center gap-1 w-max font-medium">
                    {material.catalog_number}
                    <ExternalLink size={10} />
                  </a>
                </td>
                <td className="p-3 text-[#2C2C2C] text-sm text-center">{material.quantity}</td>
                <td className="p-3 text-[#5C5C5C] text-sm">{material.unit}</td>
                <td className={`p-3 text-sm text-right font-medium ${material.is_expensive ? 'text-[#A67C52]' : 'text-[#2C2C2C]'}`}>
                  {formatCurrency(material.unit_price_usd)}
                </td>
                <td className="p-3 text-[#5C5C5C] text-xs">{material.storage}</td>
              </tr>
            ))}
            <tr className="bg-[#EEE9E0] border-t border-[#DDD8CF]">
              <td colSpan={4} className="p-3 text-[#2C2C2C] font-medium text-right">
                Total (estimated)
              </td>
              <td className="p-3 text-[#2C2C2C] font-bold text-right">
                {formatCurrency(total)}
              </td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-[#8C8C8C] text-xs mt-3 italic">
        Prices are estimates. Click catalog numbers to verify current pricing on Sigma-Aldrich.
      </p>

      {expensiveItems.length > 0 && (
        <div className="mt-4 p-4 bg-[#FBF5EC] rounded-xl border border-[#D4B896]">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="text-[#A67C52]" size={16} />
            <span className="text-[#A67C52] text-sm font-medium">
              {expensiveItems.length} expensive item(s) detected
            </span>
          </div>
          <p className="text-[#5C5C5C] text-xs mt-1">
            See the alternatives panel below the plan.
          </p>
        </div>
      )}
    </div>
  )
}
