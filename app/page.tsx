'use client'

import { useState, useEffect } from 'react'
import { Plus, DollarSign, TrendingUp, Users } from 'lucide-react'
import TeamCard from '@/components/TeamCard'
import SpendingChart from '@/components/SpendingChart'
import MonthSelector from '@/components/MonthSelector'
import { dbOperations, type TeamWithExpenditures, type Team, type Member, type MemberWithSpending } from '@/lib/supabase'
import { t, locale } from '@/lib/i18n'

interface TeamWithMembers extends Team {
  members: MemberWithSpending[]
  totalBudget: number
  totalSpent: number
  remaining: number
}

export default function Dashboard() {
  const [teamsData, setTeamsData] = useState<TeamWithExpenditures[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [teamsWithMembers, setTeamsWithMembers] = useState<TeamWithMembers[]>([])
  const [loading, setLoading] = useState(true)
  
  // Month selection state
  const now = new Date()
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth())

  useEffect(() => {
    initializeAndLoadData()
  }, [selectedYear, selectedMonth])

  const initializeAndLoadData = async () => {
    try {
      setLoading(true)
      
      // Initialize teams if needed
      await dbOperations.initializeTeams()
      
      // Load teams, members and expenditures for selected month
      const [teamsResult, expenditures, allMembers] = await Promise.all([
        dbOperations.getTeams(),
        dbOperations.getExpenditures(selectedYear, selectedMonth),
        dbOperations.getTeamMembers()
      ])
      
      setTeams(teamsResult)
      
      // Process teams with member data
      const teamsWithMemberData = await Promise.all(
        teamsResult.map(async (team) => {
          const teamMembers = allMembers.filter(m => m.team_id === team.id)
          
          // Get all team expenditures
          const teamExpenditures = expenditures.filter(exp => exp.team_id === team.id)
          const unassignedSpending = teamExpenditures
            .filter(exp => !exp.member_id)
            .reduce((sum, exp) => sum + exp.amount, 0)
          
          // Calculate individual budget from team budget
          const individualBudget = team.budget && teamMembers.length > 0 
            ? team.budget / teamMembers.length 
            : null
          
          // Get member spending data
          const membersWithSpending = await Promise.all(
            teamMembers.map(async (member) => {
              const memberExp = expenditures.filter(exp => exp.member_id === member.id)
              const totalSpent = memberExp.reduce((sum, exp) => sum + exp.amount, 0)
              
              return {
                ...member,
                budget: individualBudget,
                totalSpent,
                remaining: individualBudget ? individualBudget - totalSpent : null,
                percentageUsed: individualBudget ? (totalSpent / individualBudget) * 100 : null
              } as MemberWithSpending
            })
          )
          
          // Calculate team totals - use team budget or sum of members if no team budget
          const totalBudget = team.budget || 0
          
          const memberSpending = membersWithSpending.reduce((sum, m) => sum + m.totalSpent, 0)
          const totalSpent = memberSpending + unassignedSpending
          
          return {
            ...team,
            members: membersWithSpending,
            totalBudget,
            totalSpent,
            remaining: totalBudget - totalSpent
          } as TeamWithMembers
        })
      )
      
      setTeamsWithMembers(teamsWithMemberData)
      
      // Keep the old teamsData format for compatibility with existing components
      const teamsWithData = teamsResult.map(team => {
        const teamData = teamsWithMemberData.find(t => t.id === team.id)!
        const teamExpenditures = expenditures.filter(exp => exp.team_id === team.id)
        
        return {
          ...team,
          expenditures: teamExpenditures,
          totalSpent: teamData.totalSpent,
          remaining: teamData.remaining,
          percentageUsed: teamData.totalBudget > 0 ? (teamData.totalSpent / teamData.totalBudget) * 100 : 0
        }
      })

      setTeamsData(teamsWithData)
    } catch (error) {
      console.error('Error loading data:', error)
      // Fallback to static data if database fails
      const { defaultTeams } = await import('@/lib/supabase')
      setTeams(defaultTeams)
      const staticTeamsData = defaultTeams.map(team => ({
        ...team,
        expenditures: [],
        totalSpent: 0,
        remaining: team.budget || 0,
        percentageUsed: 0
      }))
      setTeamsData(staticTeamsData)
    } finally {
      setLoading(false)
    }
  }

  const handleMonthChange = (year: number, month: number) => {
    setSelectedYear(year)
    setSelectedMonth(month)
  }

  const totalBudget = teamsWithMembers.reduce((sum, team) => sum + team.totalBudget, 0)
  const totalSpent = teamsWithMembers.reduce((sum, team) => sum + team.totalSpent, 0)
  const totalRemaining = totalBudget - totalSpent
  const totalMembers = teamsWithMembers.reduce((sum, team) => sum + team.members.length, 0)
  
  // Get selected month name
  const selectedMonthName = new Date(selectedYear, selectedMonth).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', { 
    month: 'long', 
    year: 'numeric',
    timeZone: 'Asia/Shanghai'
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!loading && teams.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No Teams Found</h1>
          <p className="text-gray-600">No teams are present in the database. Please add teams in Supabase.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{process.env.NEXT_PUBLIC_COMPANY_NAME || 'Company'} {t('dashboard.title')}</h1>
            <p className="text-gray-600 mt-2">{t('dashboard.subtitle')}</p>
          </div>
          <MonthSelector 
            currentMonth={selectedMonth}
            currentYear={selectedYear}
            onMonthChange={handleMonthChange}
          />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('dashboard.totalBudget')}</p>
                <p className="text-2xl font-bold text-gray-900">{totalBudget.toLocaleString()}U</p>
                <p className="text-xs text-gray-500">{totalMembers} {t('common.members')}</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('dashboard.totalSpent')}</p>
                <p className="text-2xl font-bold text-red-600">{totalSpent.toLocaleString()}U</p>
              </div>
              <TrendingUp className="w-8 h-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('dashboard.remaining')}</p>
                <p className="text-2xl font-bold text-green-600">{totalRemaining.toLocaleString()}U</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('common.members')}</p>
                <p className="text-2xl font-bold text-gray-900">{totalMembers}</p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">{t('dashboard.teamOverview')}</h3>
            <SpendingChart teamsData={teamsData} selectedYear={selectedYear} selectedMonth={selectedMonth} />
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">{t('dashboard.teamOverview')}</h3>
            <div className="space-y-4">
              {teamsWithMembers.map(team => (
                <div key={team.id} className="group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: team.color }}
                      ></div>
                      <span className="font-medium">{team.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{team.totalSpent.toLocaleString()}U / {team.totalBudget.toLocaleString()}U</p>
                      <p className="text-sm text-gray-600">
                        {team.totalBudget > 0 ? ((team.totalSpent / team.totalBudget) * 100).toFixed(1) : 0}% used
                      </p>
                    </div>
                  </div>
                  
                  {/* Member details on hover */}
                  <div className="hidden group-hover:block mt-2 ml-7 space-y-1">
                    {team.members.map(member => (
                      <div key={member.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-600">{member.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-700">
                            {member.budget 
                              ? `${member.totalSpent.toFixed(0)}U / ${member.budget.toFixed(0)}U`
                              : `${member.totalSpent.toFixed(0)}U spent`
                            }
                          </span>
                          {member.percentageUsed !== null && (
                            <span className="text-xs text-gray-500">
                              ({member.percentageUsed.toFixed(1)}%)
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {/* Show unassigned spending if any */}
                    {(() => {
                      const unassigned = teamsData.find(t => t.id === team.id)?.expenditures
                        .filter(exp => !exp.member_id)
                        .reduce((sum, exp) => sum + exp.amount, 0) || 0
                      return unassigned > 0 ? (
                        <div className="flex items-center justify-between text-sm border-t pt-1 mt-1">
                          <span className="text-gray-500 italic">Unassigned</span>
                          <span className="text-gray-700">{unassigned.toFixed(0)}U</span>
                        </div>
                      ) : null
                    })()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Team Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {teamsWithMembers.map(team => (
            <TeamCard 
              key={team.id} 
              team={{
                ...team,
                budget: team.totalBudget,
                expenditures: teamsData.find(t => t.id === team.id)?.expenditures || [],
                totalSpent: team.totalSpent,
                remaining: team.remaining,
                percentageUsed: team.totalBudget > 0 ? (team.totalSpent / team.totalBudget) * 100 : 0
              }} 
              members={team.members}
            />
          ))}
        </div>


      </div>
    </div>
  )
} 