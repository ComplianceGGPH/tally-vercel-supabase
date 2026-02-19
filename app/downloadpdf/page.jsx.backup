'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function IndemnityDownload() {
  const [loading, setLoading] = useState(false)
  const [submissions, setSubmissions] = useState([])
  const [filteredSubmissions, setFilteredSubmissions] = useState([])
  const [branchDropdown, setBranchDropdown] = useState('GOPENG GLAMPING PARK')
  const [actDate, setActDate] = useState('')
  const [dayName, setDayName] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('')
  const [selectedActivity, setSelectedActivity] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [groups, setGroups] = useState([])
  const [activities, setActivities] = useState([])

  // Load saved values from localStorage
  useEffect(() => {
    const savedDate = localStorage.getItem('actDate')
    const savedBranch = localStorage.getItem('
  useEffect(() => {
    applyFilters()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGroup, selectedActivity, searchQuery, submissions])

  const loadSubmissions = async () => {
    if (!branchDropdown || !actDate) {
      setSubmissions([])
      setFilteredSubmissions([])
      return
    }

    setanchDropdown(savedBranch)
    }
  }, [])

  const handleDateChange = (e) => {
    const selectedDate = e.target.value
    setActDate(selectedDate)
    localStorage.setItem('actDate', selectedDate)

    const day = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' })
    setDayName(day)
  }

  const handleBranchChange = (value) => {
    setBranchDropdown(value)
    localStorage.setItem('branchDropdown', value)
  }

  // Fetch submissions when branch and date are selected
  useEffect(() => {
    loadSubmissions()
  }, [branchDropdown, actDate])

  // Load filter options (groups and activities) when submissions change
  useEffect(() => {
    if (submissions.length > 0) {
      loadFilters()
    }
  }, [submissions])

  // Apply filters whenever any filter changes (but not on initial load)
  useEffect(() => {
    if (submissions.length > 0) {
      applyFilters()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGroup, selectedActivity, searchQuery])

  const loadSubmissions = async () => {
    setDataLoading(true)
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          id,
          branch,
          group,
          created_at,
          participant_id,
          participants!inner (
            id,
            fullname,
            nric,
            email,
            phone_number,
            age
          )
        `)
        .eq('branch', branchDropdown)
        .order('created_at', { ascending: false })
      
      if (error) throw error

      // Fetch activities for each submission
      const submissionsWithActivities = await Promise.all(
        data.map(async (submission) => {
          const { data: activities } = await supabase
            .from('activities')
            .select('activity_name, activity_date')
            .eq('submission_id', submission.id)
            .eq('activity_date', actDate)
          
          return {
            ...submission,
            activities: activities || []
          }
        })
      )
      
      // Filter out submissions with no activities on this date
      const filtered = submissionsWithActivities.filter(s => s.activities.length > 0)
      
      setSubmissions(filtered)
      setFilteredSubmissions(filtered)
    } catLoading(false)
    }
  }

  const loadFilters = () => {
    // Get unique groups from submissions
    const uniqueGroups = [...new Set(submissions.map(s => s.group).filter(Boolean))].sort()
    setGroups(uniqueGroups)

    // Get unique activities from submissions
    const uniqueActivities = [...new Set(
      submissions.flatMap(s => s.activities?.map(a => a.activity_name) || [])
    )].sort()
    setActivities(uniqueActivities)
    if (activityData) {
      const uniqueActivities = [...new Set(activityData.map(d => d.activity_name).filter(Boolean))].sort()
      setActivities(uniqueActivities)
    }
  }

  const applyFilters = () => {
    let filtered = [...submissions]

    // Filter by group
    if (selectedGroup) {
      filtered = filtered.filter(s => s.group === selectedGroup)
    }

    // Filter by activity
    if (selectedActivity) {
      filtered = filtered.filter(s => 
        s.activities?.some(a => a.activity_name === selectedActivity)
      )
    }

    // Filter by search query (name, NRIC, ID, phone)
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(s => {
        const participant = s.participants
        return (
          participant?.fullname?.toLowerCase().includes(query) ||
          participant?.nric?.toLowerCase().includes(query) ||
          participant?.email?.toLowerCase().includes(query) ||
          participant?.phone_number?.toLowerCase().includes(query) ||
          String(s.id).includes(query)
        )
      })
    }

    setFilteredSubmissions(filtered)
  }

  const clearFilters = () => {
    setSelectedGroup('')
    setSelectedActivity('')
    setSearchQuery('')
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
        const errorText = await response.text()
        console.error('API Error:', errorText)
        throw new Error('Failed to generate PDF')
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

  // Download multiple PDFs for filtered results
  const downloadFilteredPDFs = async () => {
    if (filteredSubmissions.length === 0) {
      alert('No submissions to download')
      return
    }

    if (!confirm(`Download ${filteredSubmissions.length} PDF(s)?`)) {
      return
    }

    setLoading(true)
    let successCount = 0
    let failCount = 0

    for (const submission of filteredSubmissions) {
      try {
        await downloadSinglePDF(submission.id, submission.participants.fullname)
        successCount++
        // Add delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 2000))
      } catch (error) {
        console.error(`Failed to download PDF for ${submission.participants.fullname}:`, error)
        failCount++
      }
    }

    alert(`Downloaded ${successCount} PDF(s). ${failCount > 0 ? `Failed: ${failCount}` : ''}`)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Download PDFs</h1>
            <p className="text-muted-foreground">Download participant indemnity forms</p>
          </div>
          <Link href="/">
            <Button variant="outline">
              ← Back to Home
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl">Select Branch & Date</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Branch Selection */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Branch</label>
                <Select
                  value={branchDropdown}
                  onValueChange={handleBranchChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GOPENG GLAMPING PARK">GGP</SelectItem>
                    <SelectItem value="GLAMPING @ WETLAND PUTRAJAYA">GLOW</SelectItem>
                    <SelectItem value="PUTRAJAYA LAKE RECREATION CENTER">PLRC</SelectItem>
                    <SelectItem value="PUTRAJAYA WETLAND ADVENTURE PARK">PWAP</SelectItem>
                    <SelectItem value="BOTANI">BOTANI</SelectItem>
                    <SelectItem value="GCT EVENTS">GCT EVENTS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Selection */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Date</label>
                <input
                  type="date"
                  value={actDate}
                  onChange={handleDateChange}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                />
                {dayName && <span className="text-sm text-muted-foreground">({dayName})</span>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Secondary Filters */}
        {submissions.length > 0 && (
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">Filter Results</CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              {/* Search by Name, NRIC, ID, Phone */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Search</label>
                <Input
                  placeholder="Name, NRIC, ID, Phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={loading}
                />
              </div>

              {/* Filter by Group */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Group</label>
                <Select
                  value={selectedGroup}
                  onValueChange={setSelectedGroup}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All groups" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map(group => (
                      <SelectItem key={group} value={group}>{group}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filter by Activity */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Activity</label>
                <Select
                  value={selectedActivity}
                  onValueChange={setSelectedActivity}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All activities" />
                  </SelectTrigger>
                  <SelectContent>
                    {activities.map(activity => (
                      <SelectItem key={activity} value={activity}>{activity}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Badge variant="secondary" className="text-base">
                {filteredSubmissions.length} submission(s) found
              </Badge>
              <Button
                onClick={downloadFilteredPDFs}
                disabled={filteredSubmissions.length === 0 || loading}
                size="lg"
              >
                {loading ? 'Generating...' : `Download All (${filteredSubmissions.length})`}
              </Button>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Submissions Table */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl">Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            {!branchDropdown || !actDate ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">Please select a branch and date to view submissions.</p>
              </div>
            ) : loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading submissions...</p>
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">No submissions found.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {submissions.length === 0 
                    ? 'No participants have activities on this date.'
                    : 'Try adjusting your filters.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>NRIC</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Group</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Activities</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubmissions.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell className="font-mono text-xs">
                          {String(submission.id).slice(0, 8)}...
                        </TableCell>
                        <TableCell className="font-medium">
                          {submission.participants?.fullname}
                        </TableCell>
                        <TableCell>{submission.participants?.nric}</TableCell>
                        <TableCell className="text-sm">
                          {submission.participants?.phone_number}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {submission.group || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{submission.branch}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {submission.activities?.length > 0 ? (
                              submission.activities.slice(0, 2).map((act, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {act.activity_name}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-muted-foreground text-sm">N/A</span>
                            )}
                            {submission.activities?.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{submission.activities.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            onClick={() => downloadSinglePDF(submission.id, submission.participants?.fullname)}
                            disabled={loading}
                            variant="default"
                            size="sm"
                          >
                            Download
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