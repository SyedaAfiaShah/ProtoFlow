'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Send, CheckCircle2, ChevronDown, ChevronUp, FlaskConical, TestTube, Loader2 } from 'lucide-react'
import { ProtocolStep, Material, FeedbackItem, ReviewState } from '@/lib/types'

interface Props {
  protocol: ProtocolStep[]
  materials: Material[]
  parsed: {
    domain: string
    assay_method: string
  }
  onFeedbackSubmitted: (count: number) => void
}

export default function ReviewPanel({
  protocol,
  materials,
  parsed,
  onFeedbackSubmitted
}: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<'protocol' | 'materials'>('protocol')
  const [reviews, setReviews] = useState<ReviewState>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function setRating(key: string, rating: number) {
    setReviews(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        rating,
        correction: prev[key]?.correction ?? '',
        submitted: false
      }
    }))
  }

  function setCorrection(key: string, correction: string) {
    setReviews(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        rating: prev[key]?.rating ?? 0,
        correction,
        submitted: false
      }
    }))
  }

  async function handleSubmit() {
    const items: FeedbackItem[] = []

    protocol.forEach((step, i) => {
      const key = `protocol-${i}`
      const review = reviews[key]
      if (review && (review.rating > 0 || review.correction.trim())) {
        items.push({
          domain: parsed.domain,
          assay_method: parsed.assay_method,
          section: 'protocol',
          item_label: step.title,
          original_text: step.description,
          correction: review.correction.trim() || 'Rated ' + review.rating + '/5 - no text correction',
          rating: review.rating || 3
        })
      }
    })

    materials.forEach((mat, i) => {
      const key = `material-${i}`
      const review = reviews[key]
      if (review && (review.rating > 0 || review.correction.trim())) {
        items.push({
          domain: parsed.domain,
          assay_method: parsed.assay_method,
          section: 'materials',
          item_label: mat.name,
          original_text: `${mat.catalog_number} at $${mat.unit_price_usd}`,
          correction: review.correction.trim() || 'Rated ' + review.rating + '/5 - no text correction',
          rating: review.rating || 3
        })
      }
    })

    if (items.length === 0) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      })
      const data = await res.json()
      if (data.success) {
        setSubmitted(true)
        onFeedbackSubmitted(items.length)
      }
    } catch (error) {
      console.error('Feedback submission failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const reviewCount = Object.values(reviews).filter(r => r.rating > 0 || r.correction.trim()).length

  return (
    <div className="mt-6 border border-[#DDD8CF] rounded-2xl overflow-hidden shadow-sm">
      <div
        className="bg-[#EEE9E0] p-4 cursor-pointer flex justify-between items-center hover:bg-[#DDD8CF] transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center">
          <Star className="text-[#7C9A7E] mr-2" size={18} />
          <span className="text-[#2C2C2C] font-semibold">Scientist Review</span>
          <span className="bg-[#EBF0EB] text-[#4A6B4C] border border-[#7C9A7E] text-xs px-2 py-0.5 rounded-full ml-2">
            Learning Loop
          </span>
        </div>
        {isOpen ? <ChevronUp className="text-[#5C5C5C]" size={18} /> : <ChevronDown className="text-[#5C5C5C]" size={18} />}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-[#F7F4EF]"
          >
            <div className="p-4">
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-[#EBF0EB] border border-[#7C9A7E] rounded-xl p-6 text-center"
                >
                  <CheckCircle2 className="text-[#4A6B4C] mx-auto mb-3" size={32} />
                  <h3 className="text-[#4A6B4C] text-lg font-semibold mb-2">Feedback Submitted!</h3>
                  <p className="text-[#5C5C5C] text-sm">
                    Your corrections have been saved. The next experiment plan for similar {parsed.domain} experiments will incorporate your feedback automatically.
                  </p>
                </motion.div>
              ) : (
                <>
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setActiveSection('protocol')}
                      className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeSection === 'protocol' ? 'bg-[#7C9A7E] text-white' : 'bg-[#EEE9E0] text-[#5C5C5C] hover:bg-[#DDD8CF]'
                      }`}
                    >
                      <FlaskConical size={16} className="mr-2" />
                      Protocol Steps
                    </button>
                    <button
                      onClick={() => setActiveSection('materials')}
                      className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeSection === 'materials' ? 'bg-[#7C9A7E] text-white' : 'bg-[#EEE9E0] text-[#5C5C5C] hover:bg-[#DDD8CF]'
                      }`}
                    >
                      <TestTube size={16} className="mr-2" />
                      Materials
                    </button>
                  </div>

                  {activeSection === 'protocol' && (
                    <div>
                      <h4 className="text-[#5C5C5C] text-xs mb-1">Rate and correct protocol steps</h4>
                      <p className="text-[#8C8C8C] text-xs mb-4">Focus on steps that seem wrong or could be improved</p>

                      {protocol.map((step, i) => {
                        const key = `protocol-${i}`
                        return (
                          <div key={i} className="bg-white rounded-xl p-4 mb-3 border border-[#DDD8CF] shadow-sm">
                            <div className="text-[#2C2C2C] text-sm font-medium">Step {step.step_number}: {step.title}</div>
                            <div className="text-[#5C5C5C] text-xs mt-1 line-clamp-2">{step.description}</div>

                            <div className="flex items-center mt-3">
                              <span className="text-[#8C8C8C] text-xs mr-2">Rate:</span>
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star
                                  key={star}
                                  size={16}
                                  className={`cursor-pointer transition-colors ${
                                    star <= (reviews[key]?.rating || 0) ? 'text-[#A67C52] fill-[#A67C52]' : 'text-[#DDD8CF] hover:text-[#A67C52]'
                                  }`}
                                  onClick={() => setRating(key, star)}
                                />
                              ))}
                            </div>

                            <textarea
                              className="mt-2 w-full bg-[#F7F4EF] border border-[#DDD8CF] rounded-lg p-2 text-[#2C2C2C] text-xs placeholder-[#8C8C8C] focus:outline-none focus:ring-1 focus:ring-[#7C9A7E]"
                              placeholder="Suggest a correction or improvement (optional)..."
                              rows={2}
                              value={reviews[key]?.correction || ''}
                              onChange={(e) => setCorrection(key, e.target.value)}
                            />
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {activeSection === 'materials' && (
                    <div>
                      <h4 className="text-[#5C5C5C] text-xs mb-4">Rate and correct materials</h4>

                      {materials.map((mat, i) => {
                        const key = `material-${i}`
                        return (
                          <div key={i} className="bg-white rounded-xl p-4 mb-3 border border-[#DDD8CF] shadow-sm">
                            <div className="text-[#2C2C2C] text-sm font-medium">{mat.name}</div>
                            <div className="text-[#5C5C5C] text-xs mt-1">{mat.catalog_number} at ${mat.unit_price_usd}</div>

                            <div className="flex items-center mt-3">
                              <span className="text-[#8C8C8C] text-xs mr-2">Rate:</span>
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star
                                  key={star}
                                  size={16}
                                  className={`cursor-pointer transition-colors ${
                                    star <= (reviews[key]?.rating || 0) ? 'text-[#A67C52] fill-[#A67C52]' : 'text-[#DDD8CF] hover:text-[#A67C52]'
                                  }`}
                                  onClick={() => setRating(key, star)}
                                />
                              ))}
                            </div>

                            <textarea
                              className="mt-2 w-full bg-[#F7F4EF] border border-[#DDD8CF] rounded-lg p-2 text-[#2C2C2C] text-xs placeholder-[#8C8C8C] focus:outline-none focus:ring-1 focus:ring-[#7C9A7E]"
                              placeholder="Suggest a better reagent, grade, or supplier (optional)..."
                              rows={2}
                              value={reviews[key]?.correction || ''}
                              onChange={(e) => setCorrection(key, e.target.value)}
                            />
                          </div>
                        )
                      })}
                    </div>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={reviewCount === 0 || isSubmitting}
                    className="mt-4 w-full bg-[#7C9A7E] hover:bg-[#6B8A6D] text-white font-medium rounded-lg px-4 py-3 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={18} className="mr-2 animate-spin" />
                        Saving feedback...
                      </>
                    ) : (
                      <>
                        <Send size={18} className="mr-2" />
                        Submit Feedback ({reviewCount} items)
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
