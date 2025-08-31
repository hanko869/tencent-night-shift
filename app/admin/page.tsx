'use client'

import { useState, useEffect } from 'react'
import { Lock, Plus, Edit, Trash2, Save, X, Calculator, Settings, BarChart3, Users } from 'lucide-react'
import { dbOperations, isDatabaseConnected, type Team, type Expenditure, type Member } from '@/lib/supabase'
import { getBeiJingDate } from '@/lib/timezone'
import { useRouter } from 'next/navigation'
import MonthSelector from '@/components/MonthSelector'
import TeamManagement from '@/components/TeamManagement'
import MemberManagement from '@/components/MemberManagement'
import { t, locale } from '@/lib/i18n'

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [teams, setTeams] = useState<Team[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [expenditures, setExpenditures] = useState<Expenditure[]>([])
  const [editingExpenditure, setEditingExpenditure] = useState<Expenditure | null>(null)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showBudgetManagement, setShowBudgetManagement] = useState(false)
  const [showTeamManagement, setShowTeamManagement] = useState(false)
  const [showMemberManagement, setShowMemberManagement] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState<string>('')
  const [newExpenditure, setNewExpenditure] = useState<{
    team_id: string;
    member_id: string;
    amount: number;
    unit_price: number | '';
    quantity: number | '';
    description: string;
    date: string;
  }>({
    team_id: '',
    member_id: '',
    amount: 0,
    unit_price: '',
    quantity: '',
    description: '',
    date: getBeiJingDate()
  })
  const [teamFilter, setTeamFilter] = useState<string>('all')
  const router = useRouter()
  
  // Month selection state
  const now = new Date()
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth())

  useEffect(() => {
    if (isAuthenticated) {
      loadData()
    }
  }, [isAuthenticated, selectedYear, selectedMonth])

  useEffect(() => {
    // Load members when team is selected
    if (newExpenditure.team_id) {
      loadTeamMembers(newExpenditure.team_id)
    }
  }, [newExpenditure.team_id])

  useEffect(() => {
    // Update date when month changes to ensure new expenditures are in the right month
    if (selectedYear === now.getFullYear() && selectedMonth === now.getMonth()) {
      setNewExpenditure(prev => ({ ...prev, date: getBeiJingDate() }))
    } else {
      // Set to first day of selected month
      const firstDay = new Date(selectedYear, selectedMonth, 1)
      const dateStr = `${firstDay.getFullYear()}-${String(firstDay.getMonth() + 1).padStart(2, '0')}-01`
      setNewExpenditure(prev => ({ ...prev, date: dateStr }))
    }
  }, [selectedYear, selectedMonth])

  const handleMonthChange = (year: number, month: number) => {
    setSelectedYear(year)
    setSelectedMonth(month)
  }

  // Get selected month name
  const selectedMonthName = new Date(selectedYear, selectedMonth).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', { 
    month: 'long', 
    year: 'numeric',
    timeZone: 'Asia/Shanghai'
  })

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (username === 'admin' && password === '654321') {
      setIsAuthenticated(true)
    } else {
      alert(locale === 'zh' ? '账号或密码错误' : 'Invalid credentials')
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      // Don't initialize teams automatically - let users create their own
      // await dbOperations.initializeTeams()
      const [teamsData, expendituresData, allMembers] = await Promise.all([
        dbOperations.getTeams(),
        dbOperations.getExpenditures(selectedYear, selectedMonth),
        dbOperations.getTeamMembers()
      ])
      setTeams(teamsData)
      setExpenditures(expendituresData)
      setMembers(allMembers)
    } catch (error) {
      console.error('Error loading data:', error)
      alert(locale === 'zh' ? '加载数据失败。数据库可能未连接。' : 'Error loading data. Database may not be connected yet.')
    } finally {
      setLoading(false)
    }
  }

  const loadTeamMembers = async (teamId: string) => {
    const teamMembers = await dbOperations.getTeamMembers(teamId)
    setMembers(teamMembers)
    // Reset member selection when team changes
    setSelectedMemberId('')
  }

  const calculateTotal = (unitPrice: number | '', quantity: number | '') => {
    const price = typeof unitPrice === 'number' ? unitPrice : parseFloat(unitPrice || '0')
    const qty = typeof quantity === 'number' ? quantity : parseInt(quantity || '0')
    return price * qty
  }

  const handleAddExpenditure = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const unitPrice = typeof newExpenditure.unit_price === 'number' ? newExpenditure.unit_price : parseFloat(newExpenditure.unit_price || '0')
      const quantity = typeof newExpenditure.quantity === 'number' ? newExpenditure.quantity : parseInt(newExpenditure.quantity || '0')
      const totalAmount = unitPrice * quantity

      const expenditureData = {
        team_id: newExpenditure.team_id,
        member_id: selectedMemberId || undefined,
        amount: totalAmount,
        unit_price: unitPrice,
        quantity: quantity,
        description: newExpenditure.description,
        date: newExpenditure.date,
      }

      const result = await dbOperations.addExpenditureWithMember(expenditureData)
      
      if (result) {
        await loadData() // Refresh the data
        setNewExpenditure({
          team_id: '',
          member_id: '',
          amount: 0,
          unit_price: '',
          quantity: '',
          description: '',
          date: getBeiJingDate()
        })
        setSelectedMemberId('')
        setShowAddForm(false)
        alert(locale === 'zh' ? '✅ 已成功写入数据库！' : '✅ Expenditure added successfully to database!')
      } else {
        alert(locale === 'zh' ? '❌ 错误：无法写入数据库，请检查环境变量。' : '❌ Error: Could not save to database. Please check if environment variables are set in Vercel.')
      }
    } catch (error) {
      console.error('Error adding expenditure:', error)
      alert((locale === 'zh' ? '❌ 数据库错误：' : '❌ Database Error: ') + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const handleEditExpenditure = async (expenditure: Expenditure) => {
    setEditingExpenditure(expenditure)
    // Load members for the team of this expenditure
    await loadTeamMembers(expenditure.team_id)
  }

  const handleUpdateExpenditure = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingExpenditure) return

    setLoading(true)
    try {
      const totalAmount = editingExpenditure.unit_price * editingExpenditure.quantity
      
      const updates = {
        team_id: editingExpenditure.team_id,
        member_id: editingExpenditure.member_id,
        amount: totalAmount,
        unit_price: editingExpenditure.unit_price,
        quantity: editingExpenditure.quantity,
        description: editingExpenditure.description,
        date: editingExpenditure.date,
      }

      const result = await dbOperations.updateExpenditure(editingExpenditure.id, updates)
      
      if (result) {
        await loadData()
        setEditingExpenditure(null)
        alert(locale === 'zh' ? '已更新成功！' : 'Expenditure updated successfully!')
      } else {
        alert(locale === 'zh' ? '更新失败。' : 'Error updating expenditure.')
      }
    } catch (error) {
      console.error('Error updating expenditure:', error)
      alert(locale === 'zh' ? '更新失败。' : 'Error updating expenditure.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteExpenditure = async (id: string) => {
    if (!confirm(locale === 'zh' ? '确认删除该支出记录？' : 'Are you sure you want to delete this expenditure?')) return

    setLoading(true)
    try {
      const success = await dbOperations.deleteExpenditure(id)
      
      if (success) {
        await loadData()
        alert(locale === 'zh' ? '删除成功！' : 'Expenditure deleted successfully!')
      } else {
        alert(locale === 'zh' ? '删除失败。' : 'Error deleting expenditure.')
      }
    } catch (error) {
      console.error('Error deleting expenditure:', error)
      alert(locale === 'zh' ? '删除失败。' : 'Error deleting expenditure.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateTeamBudget = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTeam) return

    setLoading(true)
    try {
      const result = await dbOperations.updateTeamBudget(editingTeam.id, editingTeam.budget)
      
      if (result) {
        await loadData()
        setEditingTeam(null)
        alert(locale === 'zh' ? '✅ 团队预算已更新！' : '✅ Team budget updated successfully!')
      } else {
        alert(locale === 'zh' ? '❌ 更新团队预算失败。' : '❌ Error updating team budget.')
      }
    } catch (error) {
      console.error('Error updating team budget:', error)
      alert((locale === 'zh' ? '❌ 数据库错误：' : '❌ Database Error: ') + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const getTeamName = (teamId: string, expenditure?: any) => {
    const currentTeam = teams.find(team => team.id === teamId)
    if (currentTeam) return currentTeam.name
    
    // If team no longer exists, use historical name
    return expenditure?.team_name_historical || 'Unknown Team (Deleted)'
  }

  const getMemberName = (memberId: string | undefined, expenditure?: any) => {
    if (!memberId) {
      // If no member_id but we have historical name, show that
      return expenditure?.member_name_historical || 'Unassigned'
    }
    const member = members.find(m => m.id === memberId)
    if (member) return member.name
    
    // If member no longer exists, use historical name
    return expenditure?.member_name_historical || 'Unknown Member (Deleted)'
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Lock className="mx-auto h-12 w-12 text-blue-600" />
            <h2 className="mt-6 text-3xl font-bold text-gray-900">{process.env.NEXT_PUBLIC_COMPANY_NAME || 'Company'} {t('company.adminLogin')}</h2>
            <p className="mt-2 text-sm text-gray-600">
              {locale === 'zh' ? '登录以管理预算支出' : 'Sign in to manage budget expenditures'}
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder={t('admin.username')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder={t('admin.password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
            >
              {t('admin.signIn')}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-700">{locale === 'zh' ? '处理中...' : 'Processing...'}</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{process.env.NEXT_PUBLIC_COMPANY_NAME || 'Company'} {t('company.adminPanel')}</h1>
            <p className="text-gray-600 mt-2">{locale === 'zh' ? '管理团队支出与预算（北京时间 UTC+8）' : 'Manage team expenditures and budgets (Beijing Time UTC+8)'}</p>
            <p className="text-sm text-blue-600 mt-1 font-medium">
              {locale === 'zh' ? '当前管理月份：' : 'Managing data for: '} {selectedMonthName}
            </p>
          </div>
          <div className="space-x-4 flex">
            <MonthSelector 
              currentMonth={selectedMonth}
              currentYear={selectedYear}
              onMonthChange={handleMonthChange}
            />
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              disabled={loading}
            >
              <Plus className="w-4 h-4" />
              <span>{t('admin.addExpenditure')}</span>
            </button>
            <button
              onClick={() => setShowMemberManagement(!showMemberManagement)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              disabled={loading}
            >
              <Users className="w-4 h-4" />
              <span>{t('common.manageMembers')}</span>
            </button>
            <button
              onClick={() => setShowTeamManagement(!showTeamManagement)}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              disabled={loading}
            >
              <Users className="w-4 h-4" />
              <span>{t('common.manageTeams')}</span>
            </button>
            <button
              onClick={() => router.push('/')}
              className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
            >
              <BarChart3 className="w-5 h-5" />
              <span>{t('admin.viewDashboard')}</span>
            </button>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              {t('common.logout')}
            </button>
          </div>
        </div>

        {/* Member Management Section */}
        {showMemberManagement && (
          <div className="mb-8">
            <MemberManagement />
          </div>
        )}

        {/* Team Management Section */}
        {showTeamManagement && (
          <div className="mb-8">
            <TeamManagement teams={teams} onTeamsUpdate={loadData} />
          </div>
        )}

        {/* Budget Management */}
        {showBudgetManagement && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">{t('admin.budgetManagement')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {teams.map(team => (
                <div key={team.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: team.color }}
                    ></div>
                    <h4 className="font-medium">{team.name}</h4>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mb-2">
                    {team.budget.toLocaleString()}U
                  </p>
                  <button
                    onClick={() => setEditingTeam(team)}
                    disabled={loading}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    {t('admin.editTeamBudget')}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">{t('admin.addExpenditure')}</h3>
            <form onSubmit={handleAddExpenditure} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('common.team')}
                  </label>
                  <select
                    value={newExpenditure.team_id}
                    onChange={(e) => setNewExpenditure(prev => ({ ...prev, team_id: e.target.value }))}
                    required
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">{t('teams.selectTeam')}</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('common.member')}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {members.length === 0 && newExpenditure.team_id && (
                      <p className="text-sm text-gray-500">{t('teams.noMembersInTeam')}</p>
                    )}
                    {members.map(member => (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => setSelectedMemberId(member.id)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          selectedMemberId === member.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {member.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {locale === 'zh' ? '日期（北京时间）' : 'Date (Beijing Time)'}
                  </label>
                  <input
                    type="date"
                    value={newExpenditure.date}
                    onChange={(e) => setNewExpenditure(prev => ({ ...prev, date: e.target.value }))}
                    required
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('common.unitPrice')} (U)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newExpenditure.unit_price}
                    onChange={(e) => setNewExpenditure(prev => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))}
                    required
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('common.quantity')}
                  </label>
                  <input
                    type="number"
                    value={newExpenditure.quantity}
                    onChange={(e) => setNewExpenditure(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    required
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('common.description')}
                </label>
                <input
                  type="text"
                  value={newExpenditure.description}
                  onChange={(e) => setNewExpenditure(prev => ({ ...prev, description: e.target.value }))}
                  required
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder={locale === 'zh' ? '请输入描述' : 'Enter description'}
                />
              </div>

              {/* Real-time total calculation */}
              {(newExpenditure.unit_price && newExpenditure.quantity) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Calculator className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">{t('team.calculation')}</span>
                  </div>
                  <div className="mt-2 text-sm text-blue-600">
                    {newExpenditure.unit_price}U × {newExpenditure.quantity} = 
                    <span className="font-bold text-lg text-blue-700 ml-2">
                      {calculateTotal(newExpenditure.unit_price, newExpenditure.quantity).toFixed(2)}U
                    </span>
                  </div>
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{t('admin.saveExpenditure')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  disabled={loading}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <X className="h-4 w-4" />
                  <span>{t('common.cancel')}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Expenditures Table */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">{t('admin.expenditures')}</h3>
            <select
              value={teamFilter}
              onChange={e => setTeamFilter(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value="all">{t('teams.selectTeam')}</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.team')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.member')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.description')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.unitPrice')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.quantity')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.totalAmount')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.date')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {locale === 'zh' ? '操作' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expenditures
                  .filter(exp => teamFilter === 'all' || exp.team_id === teamFilter)
                  .map((expenditure) => (
                  <tr key={expenditure.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getTeamName(expenditure.team_id, expenditure)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getMemberName(expenditure.member_id, expenditure)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {expenditure.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {expenditure.unit_price?.toFixed(2) || 'N/A'}U
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {expenditure.quantity || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {expenditure.amount.toFixed(2)}U
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {expenditure.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEditExpenditure(expenditure)}
                        disabled={loading}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteExpenditure(expenditure.id)}
                        disabled={loading}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Expenditure Modal */}
        {editingExpenditure && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.editExpenditure')}</h3>
              <form onSubmit={handleUpdateExpenditure} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.team')}</label>
                  <select
                    value={editingExpenditure.team_id}
                    onChange={(e) => setEditingExpenditure({...editingExpenditure, team_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                    disabled={loading}
                  >
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.member')}</label>
                  <select
                    value={editingExpenditure.member_id || ''}
                    onChange={(e) => setEditingExpenditure({...editingExpenditure, member_id: e.target.value || undefined})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    disabled={loading}
                  >
                    <option value="">{locale === 'zh' ? '未分配' : 'Unassigned'}</option>
                    {members
                      .filter(member => member.team_id === editingExpenditure.team_id)
                      .map(member => (
                        <option key={member.id} value={member.id}>
                          {member.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.unitPrice')} (U)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingExpenditure.unit_price}
                    onChange={(e) => setEditingExpenditure({...editingExpenditure, unit_price: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.quantity')}</label>
                  <input
                    type="number"
                    min="1"
                    value={editingExpenditure.quantity}
                    onChange={(e) => setEditingExpenditure({...editingExpenditure, quantity: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{locale === 'zh' ? '日期（北京时间）' : 'Date (Beijing Time)'}</label>
                  <input
                    type="date"
                    value={editingExpenditure.date}
                    onChange={(e) => setEditingExpenditure({...editingExpenditure, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.description')}</label>
                  <input
                    type="text"
                    value={editingExpenditure.description}
                    onChange={(e) => setEditingExpenditure({...editingExpenditure, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                    disabled={loading}
                  />
                </div>
                
                {/* Total Display in Edit Modal */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{t('common.totalAmount')}:</span>
                    <span className="text-lg font-bold text-gray-900">
                      {(editingExpenditure.unit_price * editingExpenditure.quantity).toFixed(2)}U
                    </span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2" disabled={loading}>
                    <Save className="h-4 w-4" />
                    <span>{locale === 'zh' ? '更新' : 'Update'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingExpenditure(null)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2"
                    disabled={loading}
                  >
                    <X className="h-4 w-4" />
                    <span>{t('common.cancel')}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Team Budget Modal */}
        {editingTeam && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.editTeamBudget')}</h3>
              <form onSubmit={handleUpdateTeamBudget} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.team')}</label>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: editingTeam.color }}
                    ></div>
                    <span className="font-medium">{editingTeam.name}</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.monthlyBudget')}</label>
                  <input
                    type="number"
                    step="100"
                    min="0"
                    value={editingTeam.budget}
                    onChange={(e) => setEditingTeam({...editingTeam, budget: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-lg font-semibold"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    {locale === 'zh' ? '这将更新团队的月度预算上限：' : 'This will update the monthly budget cap for '}<strong>{editingTeam.name}</strong>{locale === 'zh' ? '' : ' team.'}
                  </p>
                </div>

                <div className="flex space-x-2">
                  <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2" disabled={loading}>
                    <Save className="h-4 w-4" />
                    <span>{t('admin.updateBudget')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingTeam(null)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2"
                    disabled={loading}
                  >
                    <X className="h-4 w-4" />
                    <span>{t('common.cancel')}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}


      </div>
    </div>
  )
} 