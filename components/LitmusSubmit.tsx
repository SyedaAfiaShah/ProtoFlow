'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, CheckCircle2, Loader2, ExternalLink } from 'lucide-react'
import { ExperimentPlan } from '@/lib/types'

interface Props {
  plan: ExperimentPlan
  disabled: boolean
}

export default function LitmusSubmit({ plan, disabled }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<{
    submission_id: string
    message: string
    litmus_url: string
  } | null>(null)

  async function handleSubmit() {
    setStatus('loading')
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan })
      })
      const data = await res.json()
      if (data.success) {
        setResult(data)
        setStatus('done')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="mt-8 p-6 bg-[#EBF0EB] border border-[#7C9A7E] rounded-2xl">
      <div className="flex items-center mb-2">
        <Send className="text-[#4A6B4C] mr-2" size={20} />
        <h2 className="text-[#2C2C2C] text-lg font-semibold">Submit to CRO Network</h2>
        <span className="text-[#4A6B4C] text-sm ml-1 font-medium">via Litmus</span>
      </div>

      {(status === 'idle' || status === 'loading') && (
        <>
          <p className="text-[#5C5C5C] text-sm mt-2 mb-4">
            Your complete experiment plan will be submitted to the Litmus CRO network. A vetted lab will review your protocol and provide a quote within 24 hours.
          </p>

          <button
            onClick={handleSubmit}
            disabled={disabled || status === 'loading'}
            className="w-full bg-[#7C9A7E] hover:bg-[#6B8A6D] text-white font-medium rounded-lg px-4 py-3 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {status === 'idle' ? (
              <>
                <Send size={18} className="mr-2" />
                Submit Experiment Plan to Litmus
              </>
            ) : (
              <>
                <Loader2 size={18} className="mr-2 animate-spin" />
                Submitting to Litmus...
              </>
            )}
          </button>
        </>
      )}

      <AnimatePresence>
        {status === 'done' && result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-[#7C9A7E] rounded-xl p-4 mt-4 shadow-sm"
          >
            <div className="flex items-center mb-2">
              <CheckCircle2 className="text-[#4A6B4C] mr-2" size={20} />
              <span className="text-[#4A6B4C] font-semibold">Successfully Submitted!</span>
            </div>

            <div className="mt-2">
              <div className="text-[#5C5C5C] text-xs">Submission ID:</div>
              <div className="font-mono text-[#4A6B4C] font-bold tracking-wide">{result.submission_id}</div>
            </div>

            <p className="text-[#2C2C2C] text-sm mt-2 leading-relaxed">
              {result.message}
            </p>

            <a
              href={result.litmus_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center mt-3 text-[#4A6B4C] hover:text-[#7C9A7E] text-sm transition-colors font-medium"
            >
              <ExternalLink size={14} className="mr-1" />
              Track on Litmus →
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {status === 'error' && (
        <p className="text-[#8B4545] text-sm mt-2">
          Submission failed. Please try again.
        </p>
      )}
    </div>
  )
}
