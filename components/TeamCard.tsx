'use client'

import { useState } from 'react'
import { TeamWithExpenditures, MemberWithSpending } from '@/lib/supabase'
import { ChevronDown, ChevronUp, Calculator } from 'lucide-react'
import { t } from '@/lib/i18n'

interface TeamCardProps {
  team: TeamWithExpenditures
  members?: MemberWithSpending[]
}

export default function TeamCard({ team, members }: TeamCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-danger-500'
    if (percentage >= 75) return 'bg-warning-500'
    return 'bg-success-500'
  }

  const getProgressBgColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-danger-100'
    if (percentage >= 75) return 'bg-warning-100'
    return 'bg-success-100'
  }

  const getMemberName = (memberId: string | undefined, expenditure?: any) => {
    if (!memberId || !members) {
      // If no member_id but we have historical name, show that
      return expenditure?.member_name_historical || null
    }
    const member = members.find(m => m.id === memberId)
    if (member) return member.name
    
    // If member no longer exists, use historical name
    return expenditure?.member_name_historical || 'Unknown Member (Deleted)'
  }

  const filteredExpenditures = selectedMemberId 
    ? team.expenditures.filter(exp => exp.member_id === selectedMemberId)
    : team.expenditures

  const handleMemberClick = (memberId: string) => {
    setSelectedMemberId(selectedMemberId === memberId ? null : memberId)
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{team.name}</h3>
        <div 
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: team.color }}
        ></div>
      </div>

      <div className="space-y-4">
        {/* Budget Overview */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-600">{t('team.budget')}</p>
            <p className="text-lg font-bold text-gray-900">
              {team.budget ? `${team.budget.toLocaleString()}U` : 'Unlimited'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">{t('team.spent')}</p>
            <p className="text-lg font-bold text-danger-600">{team.totalSpent.toLocaleString()}U</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">{t('team.remaining')}</p>
            <p className="text-lg font-bold text-success-600">{team.remaining.toLocaleString()}U</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">{t('team.budgetUsage')}</span>
            <span className="text-sm text-gray-600">{team.percentageUsed.toFixed(1)}%</span>
          </div>
          <div className={`w-full ${getProgressBgColor(team.percentageUsed)} rounded-full h-3`}>
            <div
              className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(team.percentageUsed)}`}
              style={{ width: `${Math.min(team.percentageUsed, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Members Section */}
        {members && members.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">{t('common.members')} ({members.length})</h4>
              <button
                onClick={() => setShowMembers(!showMembers)}
                className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 text-sm"
              >
                <span>{showMembers ? t('team.hideMembers') : t('team.showMembers')}</span>
                {showMembers ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            </div>

            {showMembers && (
              <div className="space-y-2 mb-4">
                {members.map(member => (
                  <div 
                    key={member.id} 
                    className={`bg-gray-50 rounded-lg p-3 cursor-pointer transition-all ${
                      selectedMemberId === member.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-100'
                    }`}
                    onClick={() => handleMemberClick(member.id)}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900 text-sm">{member.name}</span>
                        </div>
                        <span className="text-sm text-gray-700">
                          {member.budget 
                            ? `${member.totalSpent.toFixed(0)}U / ${member.budget.toFixed(0)}U`
                            : `${member.totalSpent.toFixed(0)}U spent`
                          }
                        </span>
                      </div>
                      {member.budget && member.percentageUsed !== null && (
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                member.percentageUsed >= 100 
                                  ? 'bg-red-500' 
                                  : member.percentageUsed >= 80 
                                  ? 'bg-yellow-500' 
                                  : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(member.percentageUsed, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600 min-w-[40px]">
                            {member.percentageUsed.toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {selectedMemberId && (
                  <button
                    onClick={() => setSelectedMemberId(null)}
                    className="text-xs text-blue-600 hover:text-blue-700 mt-2"
                  >
                    {t('team.clearFilter')}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Expenditures Section */}
        {team.expenditures.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">
                {t('team.expenses')} ({filteredExpenditures.length})
                {selectedMemberId && (
                  <span className="text-xs text-blue-600 ml-2">
                    (Filtered by {getMemberName(selectedMemberId)})
                  </span>
                )}
              </h4>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 text-sm"
              >
                <span>{isExpanded ? t('team.hideDetails') : t('team.showDetails')}</span>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            </div>

            {!isExpanded ? (
              /* Collapsed View - Recent Expenses */
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {filteredExpenditures.slice(0, 3).map((exp) => (
                  <div key={exp.id} className="flex justify-between items-center text-sm">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <span className="text-gray-600 truncate">{exp.description}</span>
                      {(exp.member_id || exp.member_name_historical) && members && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                          {getMemberName(exp.member_id, exp)}
                        </span>
                      )}
                    </div>
                    <span className="font-medium text-gray-900 ml-2">{exp.amount.toFixed(2)}U</span>
                  </div>
                ))}
                {filteredExpenditures.length > 3 && (
                  <div className="text-xs text-gray-500 text-center pt-1">
                    +{filteredExpenditures.length - 3} more expenses
                  </div>
                )}
              </div>
            ) : (
              /* Expanded View - Detailed Expenses */
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {filteredExpenditures.map((exp) => (
                  <div key={exp.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900 text-sm">{exp.description}</h5>
                        {(exp.member_id || exp.member_name_historical) && members && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full inline-block mt-1">
                            {getMemberName(exp.member_id, exp)}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{exp.date}</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-gray-600">Unit Price:</span>
                        <div className="font-medium text-gray-900">
                          {exp.unit_price?.toFixed(2) || 'N/A'}U
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Quantity:</span>
                        <div className="font-medium text-gray-900">
                          {exp.quantity || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Total:</span>
                        <div className="font-bold text-gray-900">
                          {exp.amount.toFixed(2)}U
                        </div>
                      </div>
                    </div>

                    {/* Calculation Display */}
                    {exp.unit_price && exp.quantity && (
                      <div className="mt-2 flex items-center space-x-1 text-xs text-gray-600">
                        <Calculator className="h-3 w-3" />
                        <span>
                          {exp.unit_price.toFixed(2)}U × {exp.quantity} = {exp.amount.toFixed(2)}U
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* No Expenses Message */}
        {filteredExpenditures.length === 0 && (
          <div className="text-center py-4 text-gray-500 text-sm">
            {selectedMemberId 
              ? `No expenses recorded for ${getMemberName(selectedMemberId)}`
              : 'No expenses recorded yet'
            }
          </div>
        )}
      </div>
    </div>
  )
} 