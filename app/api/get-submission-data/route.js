// app/api/get-submission-data/route.js
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const { submissionId } = await request.json()
    
    if (!submissionId) {
      return NextResponse.json({ error: 'No submissionId provided' }, { status: 400 })
    }

    // Fetch submission
    const { data: submission, error: subError } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', submissionId)
      .single()
    
    if (subError) throw subError
    
    // Fetch participant
    const { data: participant, error: partError } = await supabase
      .from('participants')
      .select('*')
      .eq('id', submission.participant_id)
      .single()
    
    if (partError) throw partError
    
    // Fetch activities
    const { data: activities, error: actError } = await supabase
      .from('activities')
      .select('*')
      .eq('submission_id', submissionId)
    
    if (actError) throw actError
    
    // Fetch emergency contact
    let emergency = null
    if (submission.emergency_id) {
      const { data: emergencyData } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('id', submission.emergency_id)
        .single()
      emergency = emergencyData
    }
    
    // Fetch guardian (if exists)
    let guardian = null
    if (submission.guardian_id) {
      const { data: guardianData } = await supabase
        .from('guardians')
        .select('*')
        .eq('id', submission.guardian_id)
        .single()
      guardian = guardianData
    }
    
    return NextResponse.json({
      submission,
      participant,
      activities,
      emergency,
      guardian
    })
    
  } catch (error) {
    console.error('Error fetching submission data:', error)
    return NextResponse.json({ 
      error: error.message,
      details: error.stack 
    }, { status: 500 })
  }
}
