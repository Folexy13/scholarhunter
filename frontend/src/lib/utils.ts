import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function getDaysLeft(deadline: Date | string): number {
  const d = typeof deadline === 'string' ? new Date(deadline) : deadline
  const now = new Date()
  const diff = d.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function getDeadlineColor(daysLeft: number): string {
  if (daysLeft < 7) return 'text-red-500'
  if (daysLeft < 14) return 'text-orange-500'
  if (daysLeft < 30) return 'text-yellow-500'
  return 'text-slate-900 dark:text-white'
}

export function formatCurrency(amount: string): string {
  return amount
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}
