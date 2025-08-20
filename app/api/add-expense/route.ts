import { NextRequest, NextResponse } from 'next/server'
import { dbOperations } from '@/lib/supabase'
import { getBeiJingDate } from '@/lib/timezone'

export async function POST(request: NextRequest) {
  try {
    // Check authentication token
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.EXPENSE_API_TOKEN

    if (!expectedToken) {
      console.error('EXPENSE_API_TOKEN not configured in environment variables')
      return NextResponse.json(
        { status: 'error', message: 'Server configuration error.' },
        { status: 500 }
      )
    }

    // Validate authorization header format and token
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { status: 'error', message: 'Unauthorized access.' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7) // Remove "Bearer " prefix
    if (token !== expectedToken) {
      return NextResponse.json(
        { status: 'error', message: 'Unauthorized access.' },
        { status: 401 }
      )
    }

    // Parse request body
    let body
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid JSON payload.' },
        { status: 400 }
      )
    }

    const { tag, unit_price, quantity, description } = body

    // Validate required fields
    if (!tag || unit_price === undefined || quantity === undefined || !description) {
      return NextResponse.json(
        { status: 'error', message: 'Missing required fields.' },
        { status: 400 }
      )
    }

    // Validate field types and values
    const parsedUnitPrice = parseFloat(unit_price)
    const parsedQuantity = parseInt(quantity)

    if (isNaN(parsedUnitPrice) || parsedUnitPrice <= 0) {
      return NextResponse.json(
        { status: 'error', message: 'unit_price must be a positive number.' },
        { status: 400 }
      )
    }

    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return NextResponse.json(
        { status: 'error', message: 'quantity must be a positive number.' },
        { status: 400 }
      )
    }

    // Find member by tag (name)
    const teams = await dbOperations.getTeams()
    let memberId = undefined
    let teamId = ''

    // Search for member by name across all teams
    for (const team of teams) {
      const teamMembers = await dbOperations.getTeamMembers(team.id)
      const member = teamMembers.find(m => m.name.toLowerCase() === tag.toLowerCase())
      if (member) {
        memberId = member.id
        teamId = team.id
        break
      }
    }

    // If no member found, we'll still create the expense but without assignment
    if (!memberId) {
      console.warn(`Member with tag "${tag}" not found. Creating unassigned expense.`)
      // Use the first team as default if no member found
      if (teams.length > 0) {
        teamId = teams[0].id
      } else {
        return NextResponse.json(
          { status: 'error', message: 'No teams available in the system.' },
          { status: 400 }
        )
      }
    }

    // Calculate total amount
    const totalAmount = parsedUnitPrice * parsedQuantity

    // Create expense record
    const expenditureData = {
      team_id: teamId,
      member_id: memberId,
      amount: totalAmount,
      unit_price: parsedUnitPrice,
      quantity: parsedQuantity,
      description: description.trim(),
      date: getBeiJingDate(),
    }

    const result = await dbOperations.addExpenditureWithMember(expenditureData)

    if (result) {
      return NextResponse.json(
        { status: 'success', message: 'Expense added successfully.' },
        { status: 200 }
      )
    } else {
      return NextResponse.json(
        { status: 'error', message: 'Failed to save expense to database.' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { status: 'error', message: 'Internal server error.' },
      { status: 500 }
    )
  }
}

// Only allow POST method
export async function GET() {
  return NextResponse.json(
    { status: 'error', message: 'Method not allowed.' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { status: 'error', message: 'Method not allowed.' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { status: 'error', message: 'Method not allowed.' },
    { status: 405 }
  )
} 