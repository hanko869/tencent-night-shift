'use client'

import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { t, monthNamesByLocale, locale } from '@/lib/i18n'

interface MonthSelectorProps {
  currentMonth: number
  currentYear: number
  onMonthChange: (year: number, month: number) => void
}

export default function MonthSelector({ currentMonth, currentYear, onMonthChange }: MonthSelectorProps) {
  const monthNames = monthNamesByLocale[locale]

  const handlePreviousMonth = () => {
    if (currentMonth === 0) {
      onMonthChange(currentYear - 1, 11)
    } else {
      onMonthChange(currentYear, currentMonth - 1)
    }
  }

  const handleNextMonth = () => {
    const now = new Date()
    const isCurrentMonth = currentYear === now.getFullYear() && currentMonth === now.getMonth()
    
    // Don't allow navigation to future months
    if (isCurrentMonth) return
    
    if (currentMonth === 11) {
      onMonthChange(currentYear + 1, 0)
    } else {
      onMonthChange(currentYear, currentMonth + 1)
    }
  }

  const handleCurrentMonth = () => {
    const now = new Date()
    onMonthChange(now.getFullYear(), now.getMonth())
  }

  const now = new Date()
  const isCurrentMonth = currentYear === now.getFullYear() && currentMonth === now.getMonth()
  const isFutureMonth = currentYear > now.getFullYear() || 
    (currentYear === now.getFullYear() && currentMonth > now.getMonth())

  return (
    <div className="flex items-center space-x-4 bg-white rounded-lg shadow-sm p-2">
      <button
        onClick={handlePreviousMonth}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label={t('common.previousMonth')}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      
      <div className="flex items-center space-x-2 min-w-[200px] justify-center">
        <Calendar className="w-5 h-5 text-gray-500" />
        <span className="font-medium text-lg">{monthNames[currentMonth]} {currentYear}</span>
        {!isCurrentMonth && (
          <span className="text-xs text-gray-500 ml-2">{t('common.historical')}</span>
        )}
      </div>
      
      <button
        onClick={handleNextMonth}
        disabled={isCurrentMonth}
        className={`p-2 rounded-lg transition-colors ${
          isCurrentMonth 
            ? 'text-gray-300 cursor-not-allowed' 
            : 'hover:bg-gray-100'
        }`}
        aria-label={t('common.nextMonth')}
      >
        <ChevronRight className="w-5 h-5" />
      </button>
      
      {!isCurrentMonth && (
        <button
          onClick={handleCurrentMonth}
          className="ml-2 px-3 py-1 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
        >
          {t('common.currentMonth')}
        </button>
      )}
    </div>
  )
} 