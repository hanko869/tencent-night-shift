'use client'

import { useState, useEffect } from 'react'
import { dbOperations, type Team, type Member } from '@/lib/supabase'
import { t, locale } from '@/lib/i18n'

interface TeamManagementProps {
  teams: Team[]
  onTeamsUpdate: () => void
}

export default function TeamManagement({ teams, onTeamsUpdate }: TeamManagementProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [editingBudget, setEditingBudget] = useState('')
  const [newTeam, setNewTeam] = useState({
    name: '',
    budget: '',
    color: '#3b82f6'
  })
  const [loading, setLoading] = useState(false)
  
  // Member management states
  const [allMembers, setAllMembers] = useState<Member[]>([])
  const [showMemberEditor, setShowMemberEditor] = useState<string | null>(null)
  const [memberToMove, setMemberToMove] = useState<Member | null>(null)
  const [targetTeamId, setTargetTeamId] = useState<string>('')

  // Predefined colors for teams
  const colorOptions = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f97316', // orange
  ]

  useEffect(() => {
    loadAllMembers()
  }, [teams])

  const loadAllMembers = async () => {
    try {
      const members = await dbOperations.getTeamMembers()
      setAllMembers(members || [])
    } catch (error) {
      console.error('Error loading members:', error)
      setAllMembers([])
    }
  }

  const getTeamMembers = (teamId: string) => {
    return allMembers.filter(member => member.team_id === teamId)
  }

  const getTeamName = (teamId: string) => {
    const team = teams.find(t => t.id === teamId)
    return team?.name || (locale === 'zh' ? '未知团队' : 'Unknown Team')
  }

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTeam.name.trim()) {
      alert(locale === 'zh' ? '请输入团队名称。' : 'Please provide a team name.')
      return
    }

    setLoading(true)
    try {
      const result = await dbOperations.createTeam({
        name: newTeam.name.trim(),
        budget: newTeam.budget ? parseFloat(newTeam.budget) : null,
        color: newTeam.color
      })

      if (result) {
        alert(locale === 'zh' ? '✅ 团队创建成功！' : '✅ Team created successfully!')
        setNewTeam({ name: '', budget: '', color: '#3b82f6' })
        setShowAddForm(false)
        onTeamsUpdate()
      } else {
        alert(locale === 'zh' ? '❌ 创建团队失败。' : '❌ Error creating team.')
      }
    } catch (error) {
      console.error('Error creating team:', error)
      alert(locale === 'zh' ? '❌ 创建团队失败。' : '❌ Error creating team.')
    } finally {
      setLoading(false)
    }
  }

  const handleEditTeam = (team: Team) => {
    setEditingTeamId(team.id)
    setEditingName(team.name)
    setEditingBudget(team.budget ? team.budget.toString() : '')
  }

  const handleSaveTeam = async (teamId: string) => {
    if (!editingName.trim()) {
      setEditingTeamId(null)
      return
    }

    setLoading(true)
    try {
      const updates = {
        name: editingName.trim(),
        budget: editingBudget ? parseFloat(editingBudget) : null
      }
      
      const result = await dbOperations.updateTeam(teamId, updates)
      if (result) {
        alert(locale === 'zh' ? '✅ 团队更新成功！' : '✅ Team updated successfully!')
        setEditingTeamId(null)
        setEditingName('')
        setEditingBudget('')
        onTeamsUpdate()
      } else {
        alert(locale === 'zh' ? '❌ 更新团队失败。' : '❌ Error updating team.')
      }
    } catch (error) {
      console.error('Error updating team:', error)
      alert(locale === 'zh' ? '❌ 更新团队失败。' : '❌ Error updating team.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    const teamMembers = getTeamMembers(teamId)
    
    const confirmMessage = teamMembers.length > 0 
      ? (locale === 'zh' 
          ? `确定要删除团队“${teamName}”吗？\n\n这也会删除 ${teamMembers.length} 名成员：${teamMembers.map(m => m.name).join(', ')}\n\n此操作不可撤销。`
          : `Are you sure you want to delete the team "${teamName}"?\n\nThis will also delete ${teamMembers.length} member(s): ${teamMembers.map(m => m.name).join(', ')}\n\nThis action cannot be undone.`)
      : (locale === 'zh' 
          ? `确定要删除团队“${teamName}”吗？此操作不可撤销。`
          : `Are you sure you want to delete the team "${teamName}"? This action cannot be undone.`)

    if (!confirm(confirmMessage)) {
      return
    }

    setLoading(true)
    try {
      const result = await dbOperations.deleteTeam(teamId)
      if (result) {
        alert(locale === 'zh' ? `✅ 已成功删除团队“${teamName}”及 ${teamMembers.length} 名成员！` : `✅ Team "${teamName}" and ${teamMembers.length} member(s) deleted successfully!`)
        await loadAllMembers()
        onTeamsUpdate()
      } else {
        alert(locale === 'zh' ? '❌ 删除团队失败。' : '❌ Error deleting team.')
      }
    } catch (error) {
      console.error('Error deleting team:', error)
      alert(locale === 'zh' ? '❌ 删除团队失败。' : '❌ Error deleting team.')
    } finally {
      setLoading(false)
    }
  }

  const handleMoveMember = async (member: Member) => {
    setMemberToMove(member)
    setTargetTeamId('')
  }

  const handleConfirmMoveMember = async () => {
    if (!memberToMove || !targetTeamId) return

    setLoading(true)
    try {
      const result = await dbOperations.updateMember(memberToMove.id, {
        team_id: targetTeamId,
        name: memberToMove.name
      })

      if (result) {
        alert(locale === 'zh' ? `✅ 已将 ${memberToMove.name} 移动至 ${getTeamName(targetTeamId)}！` : `✅ Moved ${memberToMove.name} to ${getTeamName(targetTeamId)} successfully!`)
        setMemberToMove(null)
        setTargetTeamId('')
        await loadAllMembers()
        onTeamsUpdate()
      } else {
        alert(locale === 'zh' ? '❌ 移动成员失败。' : '❌ Error moving member.')
      }
    } catch (error) {
      console.error('Error moving member:', error)
      alert(locale === 'zh' ? '❌ 移动成员失败。' : '❌ Error moving member.')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (member: Member) => {
    if (!confirm(locale === 'zh' ? `确定从 ${getTeamName(member.team_id)} 移除 ${member.name} 吗？此操作将彻底删除该成员。` : `Are you sure you want to remove ${member.name} from ${getTeamName(member.team_id)}? This will delete the member entirely.`)) {
      return
    }

    setLoading(true)
    try {
      const result = await dbOperations.deleteMember(member.id)
      if (result) {
        alert(locale === 'zh' ? `✅ 已移除 ${member.name}！` : `✅ Removed ${member.name} successfully!`)
        await loadAllMembers()
        onTeamsUpdate()
      } else {
        alert(locale === 'zh' ? '❌ 移除成员失败。' : '❌ Error removing member.')
      }
    } catch (error) {
      console.error('Error removing member:', error)
      alert(locale === 'zh' ? '❌ 移除成员失败。' : '❌ Error removing member.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">{t('teams.title')}</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
        >
          <span>+</span>
          <span>{t('teams.addTeam')}</span>
        </button>
      </div>

      {/* Add Team Form */}
      {showAddForm && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h4 className="font-medium mb-3">{t('teams.addNewTeam')}</h4>
          <form onSubmit={handleAddTeam} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('teams.teamName')}</label>
              <input
                type="text"
                value={newTeam.name}
                onChange={(e) => setNewTeam(prev => ({...prev, name: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder={locale === 'zh' ? '请输入团队名称' : 'Enter team name'}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('teams.teamBudgetOptional')}</label>
              <input
                type="number"
                value={newTeam.budget || ''}
                onChange={(e) => setNewTeam(prev => ({...prev, budget: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder={locale === 'zh' ? '输入预算金额（留空为0）' : 'Enter budget amount (leave empty for 0)'}
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('teams.teamColor')}</label>
              <div className="flex gap-2">
                {colorOptions.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewTeam(prev => ({...prev, color}))}
                    className={`w-8 h-8 rounded-full border-2 ${newTeam.color === color ? 'border-gray-600' : 'border-gray-300'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50"
              >
                <span>{t('teams.createTeam')}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Teams List */}
      <div className="space-y-4">
        {teams.map(team => {
          const teamMembers = getTeamMembers(team.id)
          return (
            <div key={team.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: team.color }}
                  ></div>
                  {editingTeamId === team.id ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col gap-2">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder={t('teams.teamName')}
                          />
                          <input
                            type="number"
                            value={editingBudget}
                            onChange={(e) => setEditingBudget(e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder={t('teams.teamBudgetOptional')}
                            min="0"
                          />
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleSaveTeam(team.id)}
                            disabled={loading}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => setEditingTeamId(null)}
                            className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <h4 className="font-medium text-lg">{team.name}</h4>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-500">({teamMembers.length} {t('common.members')})</span>
                          <span className="text-sm text-blue-600">
                            {t('team.budget')}: {team.budget ? `${team.budget.toLocaleString()}U` : 'Unlimited'}
                          </span>
                          {team.budget && teamMembers.length > 0 && (
                            <span className="text-xs text-gray-400">
                              ({(team.budget / teamMembers.length).toFixed(0)}U / {t('common.member')})
                            </span>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {editingTeamId !== team.id && (
                    <>
                      <button
                        onClick={() => setShowMemberEditor(showMemberEditor === team.id ? null : team.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title={t('common.manageMembers')}
                      >
                        👥
                      </button>
                      <button
                        onClick={() => handleEditTeam(team)}
                        disabled={loading}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title={t('teams.editName')}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteTeam(team.id, team.name)}
                        disabled={loading}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title={t('teams.deleteTeam')}
                      >
                        🗑️
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Team Members Management */}
              {showMemberEditor === team.id && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <h5 className="font-medium mb-3">{t('members.teamMembers')} ({teamMembers.length})</h5>
                  {teamMembers.length === 0 ? (
                    <p className="text-gray-500 text-sm">{t('teams.noMembersInTeam')}</p>
                  ) : (
                    <div className="space-y-2">
                      {teamMembers.map(member => (
                        <div key={member.id} className="flex items-center justify-between bg-white p-2 rounded border">
                          <div>
                            <span className="font-medium">{member.name}</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleMoveMember(member)}
                              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                              title={t('teams.moveToTeam')}
                            >
                              {t('teams.move')}
                            </button>
                            <button
                              onClick={() => handleRemoveMember(member)}
                              className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                              title={t('teams.remove')}
                            >
                              {t('teams.remove')}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Move Member Modal */}
      {memberToMove && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {t('teams.move')} {memberToMove.name}
            </h3>
            <p className="text-gray-600 mb-4">
              {locale === 'zh' ? '当前所在：' : 'Currently in:'} {getTeamName(memberToMove.team_id)}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('teams.moveToTeam')}
              </label>
              <select
                value={targetTeamId}
                onChange={(e) => setTargetTeamId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('teams.selectTeam')}</option>
                {teams
                  .filter(team => team.id !== memberToMove.team_id)
                  .map(team => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleConfirmMoveMember}
                disabled={!targetTeamId || loading}
                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {t('teams.moveMember')}
              </button>
              <button
                onClick={() => {
                  setMemberToMove(null)
                  setTargetTeamId('')
                }}
                className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 