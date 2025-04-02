"use client"

import React, { useEffect, useState } from 'react'
import { withAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import DashboardLayout from '@/components/dashboard-layout'
import { Calendar, Search, Download, ChevronDown, ChevronUp } from 'lucide-react'

interface AttendanceSession {
  id: string
  session_name: string
  timestamp: string
  student_count: number
}

function ViewAttendancePage() {
  const [sessions, setSessions] = useState<AttendanceSession[]>([])
  const [filteredSessions, setFilteredSessions] = useState<AttendanceSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [sortField, setSortField] = useState<'timestamp' | 'session_name' | 'student_count'>('timestamp')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient()
        
        // Fetch all attendance sessions
        const { data: attendanceData, error: attendanceError } = await supabase
          .from('attendance')
          .select('session_id, session_name, timestamp, student_id')
          .order('timestamp', { ascending: false })
        
        if (attendanceError) {
          throw attendanceError
        }
        
        // Group by session and count students
        const sessionMap = new Map<string, AttendanceSession>()
        attendanceData.forEach((record: {
          session_id: string;
          session_name: string;
          timestamp: string;
          student_id: string;
        }) => {
          if (!sessionMap.has(record.session_id)) {
            sessionMap.set(record.session_id, {
              id: record.session_id,
              session_name: record.session_name,
              timestamp: record.timestamp,
              student_count: 0
            })
          }
          
          const session = sessionMap.get(record.session_id)!
          session.student_count++
        })
        
        // Convert to array and sort by timestamp
        const allSessions = Array.from(sessionMap.values())
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        
        setSessions(allSessions)
        setFilteredSessions(allSessions)
      } catch (err) {
        console.error('Error fetching attendance data:', err)
        setError('Failed to load attendance data')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])
  
  // Handle search and filtering
  useEffect(() => {
    let result = [...sessions]
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        session => session.session_name.toLowerCase().includes(term) || 
                  session.id.toLowerCase().includes(term)
      )
    }
    
    // Filter by date range
    if (startDate) {
      const start = new Date(startDate)
      result = result.filter(session => new Date(session.timestamp) >= start)
    }
    
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999) // Set to end of day
      result = result.filter(session => new Date(session.timestamp) <= end)
    }
    
    // Sort results
    result.sort((a, b) => {
      let comparison = 0
      
      if (sortField === 'timestamp') {
        comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      } else if (sortField === 'session_name') {
        comparison = a.session_name.localeCompare(b.session_name)
      } else if (sortField === 'student_count') {
        comparison = a.student_count - b.student_count
      }
      
      return sortDirection === 'asc' ? comparison : -comparison
    })
    
    setFilteredSessions(result)
  }, [sessions, searchTerm, startDate, endDate, sortField, sortDirection])
  
  // Toggle sort direction
  const handleSort = (field: 'timestamp' | 'session_name' | 'student_count') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }
  
  // Export data as CSV
  const exportCSV = () => {
    if (filteredSessions.length === 0) return
    
    const headers = ['Session ID', 'Session Name', 'Date & Time', 'Student Count']
    const csvContent = [
      headers.join(','),
      ...filteredSessions.map(session => [
        session.id,
        `"${session.session_name}"`, // Quote to handle commas in names
        new Date(session.timestamp).toLocaleString(),
        session.student_count
      ].join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `attendance_export_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  
  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('')
    setStartDate('')
    setEndDate('')
    setSortField('timestamp')
    setSortDirection('desc')
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Attendance Records</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter and search attendance sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="search"
                    placeholder="Search by session name or ID"
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="startDate">From Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="startDate"
                    type="date"
                    className="pl-8"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="endDate">To Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="endDate"
                    type="date"
                    className="pl-8"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex items-end gap-2">
                <Button variant="outline" onClick={resetFilters} className="flex-1">
                  Reset
                </Button>
                <Button onClick={exportCSV} className="flex-1" disabled={filteredSessions.length === 0}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Attendance Sessions</CardTitle>
            <CardDescription>
              Showing {filteredSessions.length} {filteredSessions.length === 1 ? 'session' : 'sessions'}
              {filteredSessions.length !== sessions.length && ` (filtered from ${sessions.length})`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : error ? (
              <div className="text-red-500 text-center py-4">{error}</div>
            ) : filteredSessions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="mx-auto h-12 w-12 mb-2 text-gray-400" />
                <h3 className="text-lg font-medium mb-1">No matching attendance sessions</h3>
                <p>Try adjusting your filters or take attendance to create new sessions</p>
              </div>
            ) : (
              <div className="border rounded-md overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer"
                        onClick={() => handleSort('session_name')}
                      >
                        Session Name
                        {sortField === 'session_name' && (
                          sortDirection === 'asc' 
                            ? <ChevronUp className="inline ml-1 h-4 w-4" /> 
                            : <ChevronDown className="inline ml-1 h-4 w-4" />
                        )}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer"
                        onClick={() => handleSort('timestamp')}
                      >
                        Date & Time
                        {sortField === 'timestamp' && (
                          sortDirection === 'asc' 
                            ? <ChevronUp className="inline ml-1 h-4 w-4" /> 
                            : <ChevronDown className="inline ml-1 h-4 w-4" />
                        )}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer text-right"
                        onClick={() => handleSort('student_count')}
                      >
                        Students
                        {sortField === 'student_count' && (
                          sortDirection === 'asc' 
                            ? <ChevronUp className="inline ml-1 h-4 w-4" /> 
                            : <ChevronDown className="inline ml-1 h-4 w-4" />
                        )}
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell className="font-medium">
                          {session.session_name}
                          <div className="text-xs text-gray-500">ID: {session.id}</div>
                        </TableCell>
                        <TableCell>
                          {new Date(session.timestamp).toLocaleDateString()} {new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                        <TableCell className="text-right">{session.student_count}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm">
                            View Details
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
      </div>
    </DashboardLayout>
  )
}

export default withAuth(ViewAttendancePage)

