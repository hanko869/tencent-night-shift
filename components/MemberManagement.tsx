'use client'

import { useState, useEffect } from 'react'
import { dbOperations, type Team, type Member } from '@/lib/supabase'
import { t, locale } from '@/lib/i18n'

const MemberManagement = () => {
  const [teams, setTeams] = useState<Team[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<string>('')
  const [newMemberName, setNewMemberName] = useState('')
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [editingMemberName, setEditingMemberName] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    loadTeams()
  }, [])

  useEffect(() => {
    if (selectedTeamId) {
      loadMembers(selectedTeamId)
    } else {
      // Clear members when no team is selected
      setMembers([])
    }
  }, [selectedTeamId])

  const loadTeams = async () => {
    try {
      const data = await dbOperations.getTeams()
      setTeams(data || [])
      if (data && data.length > 0 && !selectedTeamId) {
        setSelectedTeamId(data[0].id)
      }
    } catch (error) {
      console.error('Error loading teams:', error)
      setTeams([])
    } finally {
      setInitialLoading(false)
    }
  }

  const loadMembers = async (teamId: string) => {
    try {
      const data = await dbOperations.getTeamMembers(teamId)
      setMembers(data || [])
    } catch (error) {
      console.error('Error loading members:', error)
      setMembers([])
    }
  }

  const handleAddMember = async () => {
    if (!newMemberName.trim() || !selectedTeamId) return

    setLoading(true)
    try {
      const newMember = await dbOperations.createMember({
        team_id: selectedTeamId,
        name: newMemberName.trim()
      })

      if (newMember) {
        setNewMemberName('')
        await loadMembers(selectedTeamId)
      }
    } catch (error) {
      console.error('Error adding member:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateMemberName = async () => {
    if (!editingMemberId || !editingMemberName.trim()) return

    setLoading(true)
    try {
      const updated = await dbOperations.updateMember(editingMemberId, {
        name: editingMemberName.trim()
      })

      if (updated) {
        setEditingMemberId(null)
        setEditingMemberName('')
        await loadMembers(selectedTeamId)
      }
    } catch (error) {
      console.error('Error updating member:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm(locale === 'zh' ? '确定要删除该成员吗？' : 'Are you sure you want to delete this member?')) return

    setLoading(true)
    try {
      const success = await dbOperations.deleteMember(memberId)
      if (success) {
        await loadMembers(selectedTeamId)
      }
    } catch (error) {
      console.error('Error deleting member:', error)
    } finally {
      setLoading(false)
    }
  }

  const startEditingMember = (member: Member) => {
    setEditingMemberId(member.id)
    setEditingMemberName(member.name)
  }

  const cancelEditingMember = () => {
    setEditingMemberId(null)
    setEditingMemberName('')
  }

  if (initialLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{locale === 'zh' ? '正在加载成员管理...' : 'Loading member management...'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">{t('members.title')}</h2>

      {/* Team Selector */}
      {teams.length > 0 ? (
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">{t('members.selectTeam')}</label>
          <select
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="mb-6 text-center text-gray-500">
          <p>{locale === 'zh' ? '未找到团队，请先添加团队。' : 'No teams found. Please add teams first.'}</p>
        </div>
      )}

      {/* Add New Member */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4">{t('members.addNew')}</h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder={t('members.placeholderName')}
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && handleAddMember()}
          />
          <button
            onClick={handleAddMember}
            disabled={loading || !newMemberName.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <span>+</span>
            <span>{t('common.add')}</span>
          </button>
        </div>
      </div>

      {/* Members List */}
      <div className="bg-white rounded-lg shadow">
        <h3 className="text-lg font-semibold p-4 border-b">{t('members.teamMembers')}</h3>
        <div className="p-4">
          {members.length === 0 ? (
            <p className="text-gray-500 text-center py-4">{t('members.noMembers')}</p>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {editingMemberId === member.id ? (
                      <input
                        type="text"
                        value={editingMemberName}
                        onChange={(e) => setEditingMemberName(e.target.value)}
                        className="flex-1 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') handleUpdateMemberName()
                          if (e.key === 'Escape') cancelEditingMember()
                        }}
                        autoFocus
                      />
                    ) : (
                      <>
                        <span className="font-medium">{member.name}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {editingMemberId === member.id ? (
                      <>
                        <button
                          onClick={handleUpdateMemberName}
                          disabled={loading}
                          className="p-2 text-green-600 hover:bg-green-50 rounded"
                        >
                          ✓
                        </button>
                        <button
                          onClick={cancelEditingMember}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEditingMember(member)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteMember(member.id)}
                          disabled={loading}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MemberManagement 