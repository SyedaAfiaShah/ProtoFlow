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
    <div className="mt-8 p-6 bg-gradient-to-r from-indigo-900/40 to-violet-900/40 border border-indigo-500/30 rounded-2xl">
      <div className="flex items-center mb-2">
        <Send className="text-indigo-400 mr-2" size={20} />
        <h2 className="text-white text-lg font-semibold">Submit to CRO Network</h2>
        <span className="text-indigo-400 text-sm ml-1">via Litmus</span>
      </div>

      {(status === 'idle' || status === 'loading') && (
        <>
          <p className="text-slate-400 text-sm mt-2 mb-4">
            Your complete experiment plan will be submitted to the Litmus CRO network. A vetted lab will review your protocol and provide a quote within 24 hours.
          </p>

          <button
            onClick={handleSubmit}
            disabled={disabled || status === 'loading'}
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-medium rounded-lg px-4 py-3 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:opacity-90"
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
            className="bg-green-900/30 border border-green-500/30 rounded-xl p-4 mt-4"
          >
            <div className="flex items-center mb-2">
              <CheckCircle2 className="text-green-400 mr-2" size={20} />
              <span className="text-green-300 font-semibold">Successfully Submitted!</span>
            </div>

            <div className="mt-2">
              <div className="text-slate-400 text-xs">Submission ID:</div>
              <div className="font-mono text-indigo-300 font-bold tracking-wide">{result.submission_id}</div>
            </div>

            <p className="text-slate-300 text-sm mt-2 leading-relaxed">
              {result.message}
            </p>

            <a
              href={result.litmus_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center mt-3 text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
            >
              <ExternalLink size={14} className="mr-1" />
              Track on Litmus →
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {status === 'error' && (
        <p className="text-red-400 text-sm mt-2">
          Submission failed. Please try again.
        </p>
      )}
    </div>
  )
}
