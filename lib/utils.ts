import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function stripMarkdown(text: string): string {
  return text
    .replace(/```json\n?/gi, '')
    .replace(/```\n?/gi, '')
    .trim()
}

export function constructSigmaUrl(catalogNumber: string): string {
  return `https://www.sigmaaldrich.com/catalog/product/sigma/${catalogNumber.toLowerCase()}`
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}
