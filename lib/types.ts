export interface ParsedHypothesis {
  intervention: string
  outcome: string
  system: string
  assay_method: string
  threshold: string
  control_condition: string
  domain:
    | 'cell_biology'
    | 'diagnostics'
    | 'chemistry'
    | 'climate'
    | 'neuroscience'
    | 'pharmacology'
    | 'materials_science'
    | 'other'
  valid_hypothesis: boolean
  validation_message: string
}

export type ModuleStatus = 'idle' | 'loading' | 'done' | 'error'

export interface GenerationStatus {
  literature: ModuleStatus
  protocol: ModuleStatus
  materials: ModuleStatus
  budget: ModuleStatus
  timeline: ModuleStatus
  validation: ModuleStatus
  alternatives: ModuleStatus
}

export interface ExperimentPlan {
  hypothesis: string
  parsed: ParsedHypothesis
  literature?: LiteratureResult
  protocol?: ProtocolStep[]
  materials?: Material[]
  budget?: Budget
  timeline?: TimelinePhase[]
  validation?: ValidationStrategy
  alternatives?: Alternative[]
  generated_at: string
}

export interface LiteratureReference {
  title: string
  authors: string
  year: number
  doi: string
  relevance: string
}

export interface LiteratureResult {
  novelty_signal: 'not_found' | 'similar_exists' | 'exact_match'
  explanation: string
  references: LiteratureReference[]
  source: 'semantic_scholar' | 'fallback'
}

export interface ProtocolStep {
  step_number: number
  title: string
  description: string
  duration: string
  critical_note?: string
  source_protocol?: string
}

export interface Material {
  name: string
  catalog_number: string
  supplier: string
  quantity: number
  unit: string
  unit_price_usd: number
  storage: string
  supplier_url: string
  verify_catalog?: boolean
  price_source?: 'fetched' | 'estimated'
  is_expensive?: boolean
}

export interface BudgetLine {
  category: 'Materials' | 'Equipment' | 'Personnel' | 'Indirect'
  item: string
  cost_usd: number
}

export interface Budget {
  materials_total: number
  equipment_cost: number
  personnel_cost: number
  indirect_cost: number
  total: number
  breakdown: BudgetLine[]
  disclaimer: string
}

export interface TimelinePhase {
  phase_number: number
  phase_name: string
  duration_weeks: number
  tasks: string[]
  dependencies: string[]
  milestone: string
}

export interface ValidationStrategy {
  success_criteria: string[]
  failure_criteria: string[]
  statistical_test: string
  sample_size: string
  controls: Array<{
    type: 'positive' | 'negative' | 'technical'
    description: string
  }>
  qc_checkpoints: string[]
  standard_applied: string
}

export interface Alternative {
  original_material: string
  alternative_name: string
  alternative_catalog?: string
  estimated_price_usd: number
  savings_percent: number
  reference_doi: string
  reference_title: string
  confidence: 'High' | 'Medium' | 'Low'
  cautionary_notes: string[]
  protocol_adjustments: string[]
  additional_controls: string[]
  validated: boolean
  no_alternative_reason?: string
}

export interface FeedbackItem {
  id?: string
  domain: string
  assay_method: string
  section: 'protocol' | 'materials'
  item_label: string
  original_text: string
  correction: string
  rating: number
  created_at?: string
}

export interface ReviewState {
  [key: string]: {
    rating: number
    correction: string
    submitted: boolean
  }
}
