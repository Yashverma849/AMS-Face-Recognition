"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import DashboardLayout from '@/components/dashboard-layout'
import FaceCapture from '@/components/face-capture'
import { takeAttendance } from '@/lib/face-recognition'
import { withAuth } from '@/lib/auth'

interface RecognizedStudent {
  id: string
  name: string
  confidence: number
}

function TakeAttendancePage() {
  const router = useRouter()
  const [sessionName, setSessionName] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [capturedImage, setCapturedImage] = useState<HTMLCanvasElement | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recognizedStudents, setRecognizedStudents] = useState<RecognizedStudent[]>([])

  // Handle face image capture
  const handleCapture = (imageData: HTMLCanvasElement) => {
    setCapturedImage(imageData)
    setRecognizedStudents([])
    setIsSuccess(false)
    setError(null)
  }

  // Reset capture and allow retaking
  const resetCapture = () => {
    setCapturedImage(null)
    setRecognizedStudents([])
  }
  
  // Process the attendance
  const handleProcessAttendance = async () => {
    if (!capturedImage) {
      setError('Please capture an image first')
      return
    }
    
    if (!sessionName || !sessionId) {
      setError('Please enter session name and ID')
      return
    }
    
    setIsProcessing(true)
    setError(null)
    
    try {
      // Prepare session data
      const sessionData = {
        id: sessionId,
        name: sessionName,
        timestamp: new Date().toISOString()
      }
      
      // Process attendance using face recognition
      const result = await takeAttendance(sessionData, capturedImage)
      
      // Update the UI with recognized students
      if (result && result.recognizedStudents) {
        setRecognizedStudents(result.recognizedStudents)
        setIsSuccess(true)
      } else {
        setError('No students were recognized in the image')
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An error occurred while processing attendance')
      }
      console.error('Attendance processing error:', err)
    } finally {
      setIsProcessing(false)
    }
  }
  
  // Save the attendance records
  const handleSaveAttendance = async () => {
    if (recognizedStudents.length === 0) {
      setError('No students recognized to save attendance')
      return
    }
    
    setIsProcessing(true)
    setError(null)
    
    try {
      // The attendance records have already been saved during recognition
      // This is just to confirm and provide feedback to the user
      
      // Reset the form after successful save
      setTimeout(() => {
        setSessionName('')
        setSessionId('')
        setCapturedImage(null)
        setRecognizedStudents([])
        setIsSuccess(false)
        
        // Redirect to dashboard
        router.push('/dashboard')
      }, 2000)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An error occurred while saving attendance')
      }
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Take Attendance</h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Session Information</CardTitle>
              <CardDescription>Enter the class or session details</CardDescription>
            </CardHeader>
            
            <CardContent>
              {error && (
                <Alert className="mb-4 bg-red-50 text-red-900 border-red-200">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {isSuccess && recognizedStudents.length > 0 && (
                <Alert className="mb-4 bg-green-50 text-green-900 border-green-200">
                  <AlertDescription>
                    Successfully recognized {recognizedStudents.length} student(s)!
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sessionName">Session Name</Label>
                  <Input 
                    id="sessionName" 
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    placeholder="e.g., Data Structures Lecture"
                    disabled={isProcessing || isSuccess}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sessionId">Session ID</Label>
                  <Input 
                    id="sessionId" 
                    value={sessionId}
                    onChange={(e) => setSessionId(e.target.value)}
                    placeholder="e.g., CS301-L4"
                    disabled={isProcessing || isSuccess}
                    required
                  />
                </div>
                
                <div className="pt-4 space-y-4">
                  {!isSuccess ? (
                    <Button 
                      onClick={handleProcessAttendance} 
                      className="w-full"
                      disabled={isProcessing || !capturedImage || !sessionName || !sessionId}
                    >
                      {isProcessing ? "Processing..." : "Process Attendance"}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSaveAttendance}
                      className="w-full bg-green-600 hover:bg-green-700"
                      disabled={isProcessing}
                    >
                      {isProcessing ? "Saving..." : "Save Attendance"}
                    </Button>
                  )}
                </div>
              </div>
              
              {recognizedStudents.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-2">Recognized Students</h3>
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Confidence</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recognizedStudents.map((student) => (
                          <TableRow key={student.id}>
                            <TableCell>{student.id}</TableCell>
                            <TableCell>{student.name}</TableCell>
                            <TableCell>{student.confidence.toFixed(2)}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Capture Attendance</CardTitle>
              <CardDescription>Capture an image of the class to take attendance</CardDescription>
            </CardHeader>
            
            <CardContent className="flex flex-col items-center justify-center">
              {capturedImage ? (
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <img 
                      src={capturedImage.toDataURL('image/jpeg')} 
                      alt="Captured image" 
                      className="w-full" 
                    />
                  </div>
                  
                  <Button 
                    variant="outline" 
                    onClick={resetCapture} 
                    className="w-full"
                    disabled={isProcessing || isSuccess}
                  >
                    Retake Photo
                  </Button>
                </div>
              ) : (
                <FaceCapture
                  onCapture={handleCapture}
                  buttonText="Capture Image"
                  captureText="Position the camera to capture all students in frame"
                  width={400}
                  height={300}
                />
              )}
              
              <p className="text-xs text-gray-500 mt-4">
                For best results, ensure good lighting and that all students' faces are clearly visible.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default withAuth(TakeAttendancePage)

