import { createClient } from '@supabase/supabase-js'

// Safely get environment variables with validation
const getSupabaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  return url && url.startsWith('http') ? url : null
}

const getSupabaseKey = () => {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return key && key.length > 10 ? key : null
}

const supabaseUrl = getSupabaseUrl()
const supabaseAnonKey = getSupabaseKey()

// Create Supabase client safely
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Determine database mode
type DbMode = 'supabase' | 'localStorage'
export const dbMode: DbMode = supabase ? 'supabase' : 'localStorage'

// Check if database is connected
export const isDatabaseConnected = () => {
  return dbMode === 'supabase'
}

export interface Team {
  id: string
  name: string
  budget?: number | null
  color: string
  created_at?: string
}

export interface Member {
  id: string
  team_id: string
  name: string
  created_at?: string
}

export interface MemberWithSpending extends Member {
  budget: number | null
  totalSpent: number
  remaining: number | null
  percentageUsed: number | null
}

export interface Expenditure {
  id: string
  team_id: string
  member_id?: string
  amount: number
  unit_price: number
  quantity: number
  description: string
  date: string
  created_at: string
  team_name_historical?: string
  member_name_historical?: string
}

export interface TeamWithExpenditures extends Team {
  expenditures: Expenditure[]
  totalSpent: number
  remaining: number
  percentageUsed: number
}

// Default teams (fallback when database is not available)
export const defaultTeams: Team[] = [
  { id: '1', name: 'Chen Long', budget: 9800, color: '#3b82f6' },
  { id: '2', name: '李行舟', budget: 8400, color: '#10b981' },
  { id: '3', name: '天意', budget: 8400, color: '#f59e0b' },
  { id: '4', name: '沉浮', budget: 5600, color: '#ef4444' },
]

// Helper function to get current month date range
function getCurrentMonthDateRange() {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  
  // Format dates as YYYY-MM-DD for database queries
  const formatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  return {
    start: formatDate(firstDay),
    end: formatDate(lastDay)
  }
}

// Helper function to get specific month date range
function getMonthDateRange(year: number, month: number) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  // Format dates as YYYY-MM-DD for database queries
  const formatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  return {
    start: formatDate(firstDay),
    end: formatDate(lastDay)
  }
}

// Database operations - use Supabase if available, fallback to localStorage
export const dbOperations = {
  // Get all teams
  async getTeams(): Promise<Team[]> {
    try {
      if (dbMode === 'supabase' && supabase) {
        const { data, error } = await supabase
          .from('teams')
          .select('*')
          .order('name')
        if (error) {
          console.error('Supabase error fetching teams, falling back to localStorage:', error)
          throw error // Throw to trigger local storage fallback
        }
        return data || []
      }
    } catch (error) {
      console.warn('Falling back to localStorage for getTeams.')
    }
    // Fallback to localStorage
    if (typeof window === 'undefined') return []
    const stored = localStorage.getItem('teams')
    return stored ? JSON.parse(stored) : []
  },

  // Update team budget
  async updateTeamBudget(teamId: string, newBudget: number): Promise<Team | null> {
    try {
      if (dbMode === 'supabase' && supabase) {
        const { data, error } = await supabase
          .from('teams')
          .update({ budget: newBudget })
          .eq('id', teamId)
          .select()
          .single()
        
        if (error) {
          console.error('Supabase error updating team budget, falling back to localStorage:', error)
          throw error // Throw to trigger local storage fallback
        }
        
        return data
      }
    } catch (error) {
      console.warn('Falling back to localStorage for updateTeamBudget.')
    }
    // Fallback to localStorage
    if (typeof window === 'undefined') return null

    const stored = localStorage.getItem('teams')
    const teams = stored ? JSON.parse(stored) : defaultTeams
    const teamIndex = teams.findIndex((team: Team) => team.id === teamId)
    
    if (teamIndex !== -1) {
      teams[teamIndex].budget = newBudget
      localStorage.setItem('teams', JSON.stringify(teams))
      return teams[teamIndex]
    }
    return null
  },

  // Initialize teams in database (call this once to populate)
  async initializeTeams(): Promise<boolean> {
    try {
      if (dbMode === 'supabase' && supabase) {
        // Check if teams already exist
        const { data: existingTeams } = await supabase
          .from('teams')
          .select('id')
          .limit(1)
        
        if (existingTeams && existingTeams.length > 0) {
          return true // Teams already exist
        }

        // Insert default teams
        const { error } = await supabase
          .from('teams')
          .insert(defaultTeams)
        
        if (error) {
          console.error('Supabase error initializing teams, falling back to localStorage:', error)
          throw error // Throw to trigger local storage fallback
        }
        
        return true
      }
    } catch (error) {
      console.warn('Falling back to localStorage for initializeTeams.')
    }
    // Initialize in localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('teams')
      if (!stored) {
        localStorage.setItem('teams', JSON.stringify(defaultTeams))
      }
    }
    return true
  },

  // Get all expenditures (with optional month/year filter)
  async getExpenditures(year?: number, month?: number): Promise<Expenditure[]> {
    try {
      const { start, end } = year !== undefined && month !== undefined 
        ? getMonthDateRange(year, month)
        : getCurrentMonthDateRange()
      
      if (dbMode === 'supabase' && supabase) {
        const { data, error } = await supabase
          .from('expenditures')
          .select('*')
          .gte('date', start)
          .lte('date', end)
          .order('date', { ascending: false })
          .order('created_at', { ascending: false })
        
        if (error) {
          console.error('Supabase error fetching expenditures, falling back to localStorage:', error)
          throw error // Throw to trigger local storage fallback
        }
        
        return data || []
      }
    } catch (error) {
      console.warn('Falling back to localStorage for getExpenditures.')
    }
    // Fallback to localStorage for local development
    if (typeof window === 'undefined') return []
    
    const stored = localStorage.getItem('expenditures')
    const allExpenditures = stored ? JSON.parse(stored) : []
    
    // Filter by specified or current month
    const filtered = allExpenditures.filter((exp: Expenditure) => {
      const expDate = new Date(exp.date)
      if (year !== undefined && month !== undefined) {
        return expDate.getMonth() === month && expDate.getFullYear() === year
      } else {
        const now = new Date()
        return expDate.getMonth() === now.getMonth() && 
               expDate.getFullYear() === now.getFullYear()
      }
    })
    
    // Sort by date (most recent first), then by created_at
    return filtered.sort((a: Expenditure, b: Expenditure) => {
      const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime()
      if (dateCompare !== 0) return dateCompare
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  },

  // Add new expenditure
  async addExpenditure(expenditure: Omit<Expenditure, 'id' | 'created_at'>): Promise<Expenditure | null> {
    try {
      if (dbMode === 'supabase' && supabase) {
        const { data, error } = await supabase
          .from('expenditures')
          .insert([{
            team_id: expenditure.team_id,
            amount: expenditure.amount,
            unit_price: expenditure.unit_price,
            quantity: expenditure.quantity,
            description: expenditure.description,
            date: expenditure.date
          }])
          .select()
          .single()
        
        if (error) {
          console.error('Supabase error adding expenditure, falling back to localStorage:', error)
          throw error // Throw to trigger local storage fallback
        }
        
        return data
      }
    } catch (error) {
      console.warn('Falling back to localStorage for addExpenditure.')
    }
    // Fallback to localStorage
    const newExpenditure: Expenditure = {
      ...expenditure,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    }

    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('expenditures')
      const expenditures = stored ? JSON.parse(stored) : []
      expenditures.push(newExpenditure)
      localStorage.setItem('expenditures', JSON.stringify(expenditures))
    }

    return newExpenditure
  },

  // Update expenditure
  async updateExpenditure(id: string, updates: Partial<Expenditure>): Promise<Expenditure | null> {
    try {
      if (dbMode === 'supabase' && supabase) {
        const { data, error } = await supabase
          .from('expenditures')
          .update(updates)
          .eq('id', id)
          .select()
          .single()
        
        if (error) {
          console.error('Supabase error updating expenditure, falling back to localStorage:', error)
          throw error // Throw to trigger local storage fallback
        }
        
        return data
      }
    } catch (error) {
      console.warn('Falling back to localStorage for updateExpenditure.')
    }
    // Fallback to localStorage
    if (typeof window === 'undefined') return null

    const stored = localStorage.getItem('expenditures')
    const expenditures = stored ? JSON.parse(stored) : []
    const index = expenditures.findIndex((exp: Expenditure) => exp.id === id)
    
    if (index !== -1) {
      expenditures[index] = { ...expenditures[index], ...updates }
      localStorage.setItem('expenditures', JSON.stringify(expenditures))
      return expenditures[index]
    }
    return null
  },

  // Delete expenditure
  async deleteExpenditure(id: string): Promise<boolean> {
    try {
      if (dbMode === 'supabase' && supabase) {
        const { error } = await supabase
          .from('expenditures')
          .delete()
          .eq('id', id)
        
        if (error) {
          console.error('Supabase error deleting expenditure, falling back to localStorage:', error)
          throw error // Throw to trigger local storage fallback
        }
        
        return true
      }
    } catch (error) {
      console.warn('Falling back to localStorage for deleteExpenditure.')
    }
    // Fallback to localStorage
    if (typeof window === 'undefined') return false

    const stored = localStorage.getItem('expenditures')
    const expenditures = stored ? JSON.parse(stored) : []
    const filtered = expenditures.filter((exp: Expenditure) => exp.id !== id)
    localStorage.setItem('expenditures', JSON.stringify(filtered))

    return true
  },

  // Create new team
  async createTeam(team: Omit<Team, 'id' | 'created_at'>): Promise<Team | null> {
    try {
      if (dbMode === 'supabase' && supabase) {
        // Generate a unique ID for the team
        const teamId = Date.now().toString()
        const normalizedBudget = typeof team.budget === 'number' && !isNaN(team.budget) 
          ? Math.floor(team.budget) 
          : 0
        const teamWithId = {
          ...team,
          id: teamId
        }
        // Ensure non-null numeric budget for DB constraint
        ;(teamWithId as any).budget = normalizedBudget
        
        const { data, error } = await supabase
          .from('teams')
          .insert([teamWithId])
          .select()
          .single()
        
        if (error) {
          console.error('Supabase error creating team, falling back to localStorage:', error)
          throw error // Throw to trigger local storage fallback
        }
        
        return data
      }
    } catch (error) {
      console.warn('Falling back to localStorage for createTeam.')
    }
    // Fallback to localStorage
    const newTeam: Team = {
      ...team,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    }

    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('teams')
      const teams = stored ? JSON.parse(stored) : defaultTeams
      teams.push(newTeam)
      localStorage.setItem('teams', JSON.stringify(teams))
    }

    return newTeam
  },

  // Update team (name and/or budget)
  async updateTeam(teamId: string, updates: { name?: string; budget?: number | null }): Promise<Team | null> {
    try {
      if (dbMode === 'supabase' && supabase) {
        const { data, error } = await supabase
          .from('teams')
          .update(updates)
          .eq('id', teamId)
          .select()
          .single()
        
        if (error) {
          console.error('Supabase error updating team, falling back to localStorage:', error)
          throw error // Throw to trigger local storage fallback
        }
        
        return data
      }
    } catch (error) {
      console.warn('Falling back to localStorage for updateTeam.')
    }
    // Fallback to localStorage
    if (typeof window === 'undefined') return null

    const stored = localStorage.getItem('teams')
    const teams = stored ? JSON.parse(stored) : defaultTeams
    const teamIndex = teams.findIndex((team: Team) => team.id === teamId)
    
    if (teamIndex !== -1) {
      teams[teamIndex] = { ...teams[teamIndex], ...updates }
      localStorage.setItem('teams', JSON.stringify(teams))
      return teams[teamIndex]
    }
    return null
  },

  // Update team name (legacy method, now uses updateTeam)
  async updateTeamName(teamId: string, newName: string): Promise<Team | null> {
    return this.updateTeam(teamId, { name: newName })
  },

  // Delete team (and all its expenditures)
  async deleteTeam(teamId: string): Promise<boolean> {
    try {
      if (dbMode === 'supabase' && supabase) {
        // First delete all expenditures for this team
        const { error: expError } = await supabase
          .from('expenditures')
          .delete()
          .eq('team_id', teamId)
        
        if (expError) {
          console.error('Error deleting team expenditures:', expError)
          throw expError
        }

        // Then delete the team
        const { error: teamError } = await supabase
          .from('teams')
          .delete()
          .eq('id', teamId)
        
        if (teamError) {
          console.error('Supabase error deleting team, falling back to localStorage:', teamError)
          throw teamError // Throw to trigger local storage fallback
        }
        
        return true
      }
    } catch (error) {
      console.warn('Falling back to localStorage for deleteTeam.')
    }
    // Fallback to localStorage
    if (typeof window === 'undefined') return false

    // Delete expenditures
    const expStored = localStorage.getItem('expenditures')
    const expenditures = expStored ? JSON.parse(expStored) : []
    const filteredExp = expenditures.filter((exp: Expenditure) => exp.team_id !== teamId)
    localStorage.setItem('expenditures', JSON.stringify(filteredExp))

    // Delete team
    const teamStored = localStorage.getItem('teams')
    const teams = teamStored ? JSON.parse(teamStored) : []
    const filteredTeams = teams.filter((team: Team) => team.id !== teamId)
    localStorage.setItem('teams', JSON.stringify(filteredTeams))

    return true
  },

  // Get all members for a team
  async getTeamMembers(teamId?: string): Promise<Member[]> {
    try {
      if (dbMode === 'supabase' && supabase) {
        let query = supabase.from('members').select('*')
        
        if (teamId) {
          query = query.eq('team_id', teamId)
        }
        
        const { data, error } = await query.order('name')
        
        if (error) {
          console.error('Supabase error fetching members, falling back to localStorage:', error)
          throw error // Throw to trigger local storage fallback
        }
        
        return data || []
      }
    } catch (error) {
      console.warn('Falling back to localStorage for getTeamMembers.')
    }
    // Fallback to localStorage
    if (typeof window === 'undefined') return []
    const stored = localStorage.getItem('members')
    const allMembers = stored ? JSON.parse(stored) : []
    
    if (teamId) {
      return allMembers.filter((member: Member) => member.team_id === teamId)
    }
    
    return allMembers
  },

  // Get member with spending info
  async getMemberWithSpending(memberId: string, year?: number, month?: number): Promise<MemberWithSpending | null> {
    try {
      const { start, end } = year !== undefined && month !== undefined 
        ? getMonthDateRange(year, month)
        : getCurrentMonthDateRange()
      
      if (dbMode === 'supabase' && supabase) {
        // Get member info and team info
        const { data: member, error: memberError } = await supabase
          .from('members')
          .select('*, teams(budget)')
          .eq('id', memberId)
          .single()
        
        if (memberError || !member) {
          console.error('Supabase error fetching member, falling back to localStorage:', memberError)
          throw memberError // Throw to trigger local storage fallback
        }

        // Get team member count for budget calculation
        const { data: teamMembers, error: teamMembersError } = await supabase
          .from('members')
          .select('id')
          .eq('team_id', member.team_id)
        
        if (teamMembersError) {
          console.error('Supabase error fetching team members for budget, falling back to localStorage:', teamMembersError)
          throw teamMembersError // Throw to trigger local storage fallback
        }

        // Get member spending
        const { data: expenditures, error: expError } = await supabase
          .from('expenditures')
          .select('amount')
          .eq('member_id', memberId)
          .gte('date', start)
          .lte('date', end)
        
        if (expError) {
          console.error('Supabase error fetching member expenditures, falling back to localStorage:', expError)
          throw expError // Throw to trigger local storage fallback
        }

        const totalSpent = expenditures?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0
        
        // Calculate individual budget from team budget
        const teamBudget = (member.teams as any)?.budget
        const memberCount = teamMembers?.length || 1
        const individualBudget = teamBudget ? teamBudget / memberCount : null
        
        return {
          ...member,
          budget: individualBudget,
          totalSpent,
          remaining: individualBudget ? individualBudget - totalSpent : null,
          percentageUsed: individualBudget ? (totalSpent / individualBudget) * 100 : null
        }
      }
    } catch (error) {
      console.warn('Falling back to localStorage for getMemberWithSpending.')
    }
    
    // Fallback logic for getMemberWithSpending in localStorage
    if (typeof window === 'undefined') return null

    const allMembers = JSON.parse(localStorage.getItem('members') || '[]') as Member[]
    const allExpenditures = JSON.parse(localStorage.getItem('expenditures') || '[]') as Expenditure[]
    const allTeams = JSON.parse(localStorage.getItem('teams') || '[]') as Team[]

    const member = allMembers.find(m => m.id === memberId)
    if (!member) return null

    const team = allTeams.find(t => t.id === member.team_id)
    const teamMembers = allMembers.filter(m => m.team_id === member.team_id)

    const memberExpenditures = allExpenditures.filter(exp => exp.member_id === memberId)
    const totalSpent = memberExpenditures.reduce((sum, exp) => sum + exp.amount, 0)

    const teamBudget = team?.budget
    const memberCount = teamMembers.length || 1
    const individualBudget = teamBudget ? teamBudget / memberCount : null

    return {
      ...member,
      budget: individualBudget,
      totalSpent,
      remaining: individualBudget ? individualBudget - totalSpent : null,
      percentageUsed: individualBudget ? (totalSpent / individualBudget) * 100 : null
    }
  },

  // Create new member
  async createMember(member: Omit<Member, 'id' | 'created_at'>): Promise<Member | null> {
    try {
      if (dbMode === 'supabase' && supabase) {
        const { data, error } = await supabase
          .from('members')
          .insert([member])
          .select()
          .single()
        
        if (error) {
          console.error('Supabase error creating member, falling back to localStorage:', error)
          throw error // Throw to trigger local storage fallback
        }
        
        return data
      }
    } catch (error) {
      console.warn('Falling back to localStorage for createMember.')
    }
    // Fallback to localStorage
    const newMember: Member = {
      ...member,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    }

    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('members')
      const members = stored ? JSON.parse(stored) : []
      members.push(newMember)
      localStorage.setItem('members', JSON.stringify(members))
    }

    return newMember
  },

  // Update member
  async updateMember(memberId: string, updates: Partial<Member>): Promise<Member | null> {
    try {
      if (dbMode === 'supabase' && supabase) {
        const { data, error } = await supabase
          .from('members')
          .update(updates)
          .eq('id', memberId)
          .select()
          .single()
        
        if (error) {
          console.error('Supabase error updating member, falling back to localStorage:', error)
          throw error // Throw to trigger local storage fallback
        }
        
        return data
      }
    } catch (error) {
      console.warn('Falling back to localStorage for updateMember.')
    }
    // Fallback to localStorage
    if (typeof window === 'undefined') return null

    const stored = localStorage.getItem('members')
    const members = stored ? JSON.parse(stored) : []
    const memberIndex = members.findIndex((member: Member) => member.id === memberId)
    
    if (memberIndex !== -1) {
      members[memberIndex] = { ...members[memberIndex], ...updates }
      localStorage.setItem('members', JSON.stringify(members))
      return members[memberIndex]
    }
    return null
  },

  // Delete member
  async deleteMember(memberId: string): Promise<boolean> {
    try {
      if (dbMode === 'supabase' && supabase) {
        // Member expenditures will have member_id set to NULL due to ON DELETE SET NULL
        const { error } = await supabase
          .from('members')
          .delete()
          .eq('id', memberId)
        
        if (error) {
          console.error('Supabase error deleting member, falling back to localStorage:', error)
          throw error // Throw to trigger local storage fallback
        }
        
        return true
      }
    } catch (error) {
      console.warn('Falling back to localStorage for deleteMember.')
    }
    // Fallback to localStorage
    if (typeof window === 'undefined') return false

    const stored = localStorage.getItem('members')
    const members = stored ? JSON.parse(stored) : []
    const filtered = members.filter((member: Member) => member.id !== memberId)
    localStorage.setItem('members', JSON.stringify(filtered))

    return true
  },

  // Add expenditure with member
  async addExpenditureWithMember(expenditure: Omit<Expenditure, 'id' | 'created_at'>): Promise<Expenditure | null> {
    try {
      if (dbMode === 'supabase' && supabase) {
        // First, try with member_id
        const insertData: any = {
          team_id: expenditure.team_id,
          amount: expenditure.amount,
          unit_price: expenditure.unit_price,
          quantity: expenditure.quantity,
          description: expenditure.description,
          date: expenditure.date
        }
        
        // Only add member_id if it exists
        if (expenditure.member_id) {
          insertData.member_id = expenditure.member_id
        }
        
        const { data, error } = await supabase
          .from('expenditures')
          .insert([insertData])
          .select()
          .single()
        
        if (error) {
          // If error is about member_id column not existing, try without it
          if (error.message && error.message.includes('member_id')) {
            console.warn('member_id column not found, trying without it...')
            delete insertData.member_id
            const { data: retryData, error: retryError } = await supabase
              .from('expenditures')
              .insert([insertData])
              .select()
              .single()
            
            if (retryError) {
              console.error('Supabase error adding expenditure (retry), falling back to localStorage:', retryError)
              throw retryError
            }
            
            return retryData
          }
          
          console.error('Supabase error adding expenditure with member, falling back to localStorage:', error)
          throw error // Throw to trigger local storage fallback
        }
        
        return data
      }
    } catch (error) {
      console.warn('Falling back to localStorage for addExpenditureWithMember.')
    }
    // Fallback to localStorage
    const newExpenditure: Expenditure = {
      ...expenditure,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    }

    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('expenditures')
      const expenditures = stored ? JSON.parse(stored) : []
      expenditures.push(newExpenditure)
      localStorage.setItem('expenditures', JSON.stringify(expenditures))
    }

    return newExpenditure
  },

  // Assign member to existing expenditure
  async assignMemberToExpenditure(expenditureId: string, memberId: string): Promise<boolean> {
    try {
      if (dbMode === 'supabase' && supabase) {
        const { error } = await supabase
          .from('expenditures')
          .update({ member_id: memberId })
          .eq('id', expenditureId)
        
        if (error) {
          console.error('Supabase error assigning member to expenditure, falling back to localStorage:', error)
          throw error // Throw to trigger local storage fallback
        }
        
        return true
      }
    } catch (error) {
      console.warn('Falling back to localStorage for assignMemberToExpenditure.')
    }
    // Fallback to localStorage
    if (typeof window === 'undefined') return false

    const stored = localStorage.getItem('expenditures')
    const expenditures = stored ? JSON.parse(stored) : []
    const index = expenditures.findIndex((exp: Expenditure) => exp.id === expenditureId)
    
    if (index !== -1) {
      expenditures[index].member_id = memberId
      localStorage.setItem('expenditures', JSON.stringify(expenditures))
      return true
    }
    return false
  }
} 