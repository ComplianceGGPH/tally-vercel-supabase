'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function IndemnityDownload() {
  const [loading, setLoading] = useState(false)
  const [submissions, setSubmissions] = useState([])
  const [selectedGroup, setSelectedGroup] = useState('')
  const [groups, setGroups] = useState([])

  useEffect(() => {
    loadSubmissions()
    loadGroups()
  }, [])

  const loadSubmissions = async () => {
    // Fetch submissions with participant data
    const { data, error } = await supabase
      .from('submissions')
      .select(`
        *,
        participants (
          fullname,
          nric,
          email
        ),
        activities (
          activity_name
        )
      `)
      .order('created_at', { ascending: false })
    
    if (!error) setSubmissions(data)
  }

  const loadGroups = async () => {
    const { data, error } = await supabase
      .from('submissions')
      .select('group')
    
    if (!error) {
      const uniqueGroups = [...new Set(data.map(d => d.group).filter(Boolean))]
      setGroups(uniqueGroups)
    }
  }

  // Download single PDF by submission ID
const downloadSinglePDF = async (submissionId, participantName) => {
  setLoading(true)
  try {
    const response = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submissionId })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('API Error:', errorData)
      throw new Error(errorData.error || 'Failed to generate PDF')
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `indemnity_${participantName.replace(/\s+/g, '_')}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error downloading PDF:', error)
    alert(`Failed to download PDF: ${error.message}`)
  } finally {
    setLoading(false)
  }
}

  // Download all PDFs for a specific group
  const downloadGroupPDFs = async (groupName) => {
    setLoading(true)
    try {
      // Get all submissions in this group
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          *,
          participants (
            fullname
          )
        `)
        .eq('group', groupName)

      if (error) throw error

      // Download each PDF one by one
      for (const submission of data) {
        await downloadSinglePDF(submission.id, submission.participants.fullname)
        // Add small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 1500))
      }

      alert(`Downloaded ${data.length} PDFs for group: ${groupName}`)
    } catch (error) {
      console.error('Error downloading group PDFs:', error)
      alert('Failed to download group PDFs. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Indemnity Forms - PDF Download</h1>

      {/* Download by Group */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Download by Group</h2>
        <div className="flex gap-4">
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg"
            disabled={loading}
          >
            <option value="">Select a group...</option>
            {[...groups].sort().map(group => (
            <option key={group} value={group}>{group}</option>
            ))}
          </select>
          <button
            onClick={() => downloadGroupPDFs(selectedGroup)}
            disabled={!selectedGroup || loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : 'Download All in Group'}
          </button>
        </div>
      </div>

      {/* Individual Submissions List */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Individual Submissions</h2>
        
        {submissions.length === 0 ? (
          <p className="text-gray-500">No submissions found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">NRIC</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Group</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Branch</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Activity</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {submissions.map((submission) => (
                  <tr key={submission.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-black">{submission.participants?.fullname}</td>
                    <td className="px-4 py-3 text-sm text-black">{submission.participants?.nric}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {submission.group || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-black">{submission.branch}</td>
                    <td className="px-4 py-3 text-sm text-black">
                      {submission.activities?.[0]?.activity_name || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => downloadSinglePDF(submission.id, submission.participants?.fullname)}
                        disabled={loading}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                      >
                        Download PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg">Generating PDF...</p>
            <p className="text-sm text-gray-500 mt-2">This may take a few moments...</p>
          </div>
        </div>
      )}
    </div>
  )
}