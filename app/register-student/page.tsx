"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import DashboardLayout from '@/components/dashboard-layout'
import FaceCapture from '@/components/face-capture'
import { registerStudentWithFace } from '@/lib/face-recognition'
import { registerStudentFace, testApiConnection } from '@/lib/face-recognition-api'
import { withAuth } from '@/lib/auth'

function RegisterStudentPage() {
  const router = useRouter()
  const [studentId, setStudentId] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [batch, setBatch] = useState('')
  const [semester, setSemester] = useState('')
  const [department, setDepartment] = useState('')
  const [capturedImage, setCapturedImage] = useState<HTMLCanvasElement | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [useApiRegistration, setUseApiRegistration] = useState(false)

  // Check if the API is available
  React.useEffect(() => {
    const checkApiAvailability = async () => {
      try {
        const isApiAvailable = await testApiConnection();
        setUseApiRegistration(isApiAvailable);
        console.log('API registration available:', isApiAvailable);
      } catch (err) {
        console.error('Error checking API availability:', err);
      }
    };
    
    checkApiAvailability();
  }, []);

  // Handle face image capture
  const handleCapture = (imageData: HTMLCanvasElement) => {
    setCapturedImage(imageData)
  }

  // Reset capture and allow retaking
  const resetCapture = () => {
    setCapturedImage(null)
  }
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)
    
    if (!capturedImage) {
      setError('Please capture a face image before submitting')
      setIsLoading(false)
      return
    }
    
    // Prepare student data
    const studentData = {
      id: studentId,
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      batch,
      semester,
      department
    }
    
    try {
      // Try API registration first if available
      if (useApiRegistration) {
        console.log('Using API for student registration');
        try {
          const result = await registerStudentFace(studentData, capturedImage);
          if (result.success) {
            setSuccess('Student registered successfully using API!');
          } else {
            // If API registration fails, fall back to client-side registration
            console.log('API registration failed, falling back to client-side');
            await registerStudentWithFace(studentData, capturedImage);
            setSuccess('Student registered successfully using client-side processing!');
          }
        } catch (apiError) {
          console.error('API registration error, falling back to client-side:', apiError);
          // Fall back to client-side registration
          await registerStudentWithFace(studentData, capturedImage);
          setSuccess('Student registered successfully using fallback method!');
        }
      } else {
        // Use browser-based face recognition
        console.log('Using client-side face recognition for registration');
        await registerStudentWithFace(studentData, capturedImage);
        setSuccess('Student registered successfully!');
      }
      
      // Clear form after success
      setTimeout(() => {
        setStudentId('')
        setFirstName('')
        setLastName('')
        setEmail('')
        setPhone('')
        setBatch('')
        setSemester('')
        setDepartment('')
        setCapturedImage(null)
        setSuccess(null)
        
        // Redirect to dashboard
        router.push('/dashboard')
      }, 2000)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An error occurred during registration')
      }
      console.error('Registration error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Register New Student</h1>
          {useApiRegistration && (
            <div className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
              Using enhanced API registration
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Student Information</CardTitle>
              <CardDescription>Enter the student's details below</CardDescription>
            </CardHeader>
            
            <CardContent>
              {error && (
                <Alert className="mb-4 bg-red-50 text-red-900 border-red-200">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {success && (
                <Alert className="mb-4 bg-green-50 text-green-900 border-green-200">
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="studentId">Student ID</Label>
                  <Input 
                    id="studentId" 
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="e.g., 2023001"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input 
                      id="firstName" 
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input 
                      id="lastName" 
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g., +91 9876543210"
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="batch">Batch</Label>
                    <Input 
                      id="batch" 
                      value={batch}
                      onChange={(e) => setBatch(e.target.value)}
                      placeholder="e.g., 2023-27"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="semester">Semester</Label>
                    <Input 
                      id="semester" 
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      placeholder="e.g., 1"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input 
                      id="department" 
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g., CSE"
                    />
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading || !capturedImage}
                  >
                    {isLoading ? "Registering..." : "Register Student"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Face Registration</CardTitle>
              <CardDescription>Capture the student's face for recognition</CardDescription>
            </CardHeader>
            
            <CardContent className="flex flex-col items-center justify-center">
              {capturedImage ? (
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <img 
                      src={capturedImage.toDataURL('image/jpeg')} 
                      alt="Captured face" 
                      className="w-full" 
                    />
                  </div>
                  
                  <Button 
                    variant="outline" 
                    onClick={resetCapture} 
                    className="w-full"
                    disabled={isLoading}
                  >
                    Retake Photo
                  </Button>
                </div>
              ) : (
                <FaceCapture
                  onCapture={handleCapture}
                  buttonText="Capture Face"
                  captureText="Position the student's face in the frame"
                  width={400}
                  height={300}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default withAuth(RegisterStudentPage)

