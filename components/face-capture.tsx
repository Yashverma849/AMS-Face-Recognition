"use client"

import React, { useRef, useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { detectFaces, testApiConnection, API_URL, convertToBase64 } from '@/lib/face-recognition-api'

interface FaceCaptureProps {
  onCapture: (imageData: HTMLCanvasElement) => void
  buttonText?: string
  captureText?: string
  width?: number
  height?: number
}

export default function FaceCapture({
  onCapture,
  buttonText = "Capture Face",
  captureText = "Position your face in the frame",
  width = 640,
  height = 480
}: FaceCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [isCaptureReady, setCaptureReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [faceDetected, setFaceDetected] = useState(false)
  const [apiStatus, setApiStatus] = useState<boolean | null>(null)
  
  // Start camera
  const startCamera = async () => {
    setError(null)
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: width },
          height: { ideal: height },
          facingMode: 'user'
        }
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsCameraActive(true)
        
        // Start face detection after camera is activated
        setTimeout(detectFaceInVideo, 1000)
      }
    } catch (err) {
      console.error('Error accessing camera:', err)
      setError('Cannot access camera. Please ensure you have given permission.')
    }
  }
  
  // Stop camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach(track => track.stop())
      videoRef.current.srcObject = null
      setIsCameraActive(false)
      setFaceDetected(false)
    }
  }
  
  // Detect face in video stream
  const detectFaceInVideo = async () => {
    if (!videoRef.current || !isCameraActive || !apiStatus) return
    
    try {
      console.log("Attempting to detect face in video stream...");
      
      // Convert video frame to base64
      if (!canvasRef.current) return;
      const context = canvasRef.current.getContext('2d');
      if (!context) return;
      
      // Set canvas dimensions to match video
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      
      // Draw the current video frame
      context.drawImage(videoRef.current, 0, 0);
      const imageBase64 = canvasRef.current.toDataURL('image/jpeg', 0.9);
      
      // Send to API
      const result = await detectFaces(imageBase64);
      
      console.log(`Face detection results:`, result);
      
      // Check if we have valid faces
      const hasFaces = result.success && Array.isArray(result.data) && result.data.length > 0;
      setFaceDetected(hasFaces);
      setCaptureReady(hasFaces); // Only ready when at least one face is detected
      
      // Continue detecting faces
      if (isCameraActive) {
        setTimeout(() => requestAnimationFrame(detectFaceInVideo), 500); // Reduced frequency for API calls
      }
    } catch (err) {
      console.error('Face detection error:', err);
      setError('Face detection failed. Please reload the page and try again.');
      
      // Retry detection after a delay
      setTimeout(() => {
        if (isCameraActive) {
          detectFaceInVideo();
        }
      }, 3000);
    }
  }
  
  // Capture image from video
  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current || !isCameraActive) return
    
    const context = canvasRef.current.getContext('2d')
    if (!context) return
    
    // Draw the current video frame to the canvas
    canvasRef.current.width = videoRef.current.videoWidth
    canvasRef.current.height = videoRef.current.videoHeight
    context.drawImage(videoRef.current, 0, 0)
    
    // Pass the captured image data to the parent component
    onCapture(canvasRef.current)
    
    // Optionally stop the camera
    stopCamera()
  }
  
  // Check API status
  const checkApiStatus = async () => {
    try {
      const result = await testApiConnection();
      console.log('Face API connection test:', result);
      setApiStatus(result.success);
      return result.success;
    } catch (error) {
      console.error('Face API is not available:', error);
      setApiStatus(false);
      return false;
    }
  };
  
  // Cleanup on unmount
  useEffect(() => {
    checkApiStatus();
    
    return () => {
      stopCamera()
    }
  }, [])
  
  return (
    <div className="flex flex-col items-center space-y-4">
      {error && (
        <Alert className="mb-4 bg-red-50 text-red-900 border-red-200">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {apiStatus === false && (
        <Alert className="mb-4 bg-red-50 text-red-900 border-red-200">
          <AlertDescription>
            Face detection model is not available. Please check that the API is running at {API_URL}
          </AlertDescription>
        </Alert>
      )}
      
      <Card className="overflow-hidden">
        <CardContent className="p-0 relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`bg-gray-100 ${isCameraActive ? 'block' : 'hidden'}`}
            style={{ width: `${width}px`, height: `${height}px` }}
            onPlay={() => setCaptureReady(true)}
          />
          
          {!isCameraActive && (
            <div 
              className="bg-gray-100 flex items-center justify-center"
              style={{ width: `${width}px`, height: `${height}px` }}
            >
              <p className="text-gray-500">Camera not active</p>
            </div>
          )}
          
          {isCameraActive && (
            <div 
              className={`absolute inset-0 border-4 flex items-center justify-center
                ${faceDetected ? 'border-green-500' : 'border-red-500'}`}
            >
              <p className="text-white bg-black bg-opacity-50 p-2 rounded">
                {faceDetected ? 'Face detected' : 'No face detected'}
              </p>
            </div>
          )}
          
          <canvas ref={canvasRef} className="hidden" />
        </CardContent>
      </Card>
      
      <div className="space-x-4">
        {!isCameraActive ? (
          <Button onClick={startCamera} disabled={apiStatus === false}>Start Camera</Button>
        ) : (
          <>
            <Button onClick={stopCamera} variant="outline">Stop Camera</Button>
            <Button 
              onClick={captureImage} 
              disabled={!isCaptureReady}
              variant="default"
            >
              {buttonText}
            </Button>
          </>
        )}
      </div>
      
      <p className="text-sm text-gray-500">{captureText}</p>
    </div>
  )
} 