'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Indemnity Forms</h1>
          <p className="text-muted-foreground text-lg">Download and print participant indemnity forms</p>
        </div>

        {/* Download by Group */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl">Download by Group</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Select
                value={selectedGroup}
                onValueChange={setSelectedGroup}
                disabled={loading}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a group..." />
                </SelectTrigger>
                <SelectContent>
                  {[...groups].sort().map(group => (
                    <SelectItem key={group} value={group}>{group}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => downloadGroupPDFs(selectedGroup)}
                disabled={!selectedGroup || loading}
              >
                {loading ? 'Generating...' : 'Download All in Group'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Individual Submissions List */}
        <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl">Individual Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No submissions found.</p>
              <p className="text-sm text-muted-foreground mt-2">Submissions will appear here once participants complete their forms.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>NRIC</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell>{submission.participants?.fullname}</TableCell>
                      <TableCell>{submission.participants?.nric}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {submission.group || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>{submission.branch}</TableCell>
                      <TableCell>
                        {submission.activities?.[0]?.activity_name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => downloadSinglePDF(submission.id, submission.participants?.fullname)}
                          disabled={loading}
                          variant="default"
                          size="sm"
                        >
                          Download PDF
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {loading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="max-w-sm">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto"></div>
                <div>
                  <p className="text-lg font-semibold">Generating PDF...</p>
                  <p className="text-sm text-muted-foreground mt-2">This may take a few moments</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      </div>
    </div>
  )
}