"use client"

import React, { useRef, useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { initFaceDetection, detectFaces } from '@/lib/face-recognition'
import { detectFacesWithApi, testApiConnection } from '@/lib/face-recognition-api'

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
  const [useApiDetection, setUseApiDetection] = useState(false)
  const [isApiAvailable, setIsApiAvailable] = useState(false)
  
  // Initialize face detection and check API availability
  useEffect(() => {
    const setupDetection = async () => {
      try {
        // Try to initialize TensorFlow.js models
        await initFaceDetection().catch(err => {
          console.error('TensorFlow.js initialization error:', err)
          // Don't set error yet, we'll try the API
        })
        
        // Check if API is available
        const apiAvailable = await testApiConnection();
        setIsApiAvailable(apiAvailable);
        
        if (apiAvailable) {
          console.log('Face API is available, will use as fallback');
        } else {
          console.log('Face API is not available, using TensorFlow.js only');
        }
      } catch (err) {
        console.error('Error during detection setup:', err)
        setError('Failed to initialize face detection. Please refresh the page.')
      }
    };
    
    setupDetection();
  }, [])
  
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
    if (!videoRef.current || !isCameraActive) return
    
    try {
      let faces;
      
      // First try TensorFlow.js detection if we're not set to use API
      if (!useApiDetection) {
        try {
          console.log("Attempting to detect face using TensorFlow.js...");
          faces = await detectFaces(videoRef.current);
        } catch (tfError) {
          console.error('TensorFlow.js detection error, trying API fallback:', tfError);
          
          // If TensorFlow.js fails and API is available, switch to API detection
          if (isApiAvailable) {
            setUseApiDetection(true);
            // Retry with API
            return detectFaceInVideo();
          } else {
            throw tfError; // Re-throw if API is not available
          }
        }
      } else if (isApiAvailable) {
        // Use API detection
        console.log("Attempting to detect face using API...");
        faces = await detectFacesWithApi(videoRef.current);
      } else {
        throw new Error('No face detection method available');
      }
      
      // Log detection results
      console.log(`Face detection results: ${faces.length} faces found`, faces);
      
      // Check if we have valid faces
      const hasFaces = Array.isArray(faces) && faces.length > 0;
      setFaceDetected(hasFaces)
      setCaptureReady(hasFaces) // Only ready when at least one face is detected
      
      // Continue detecting faces
      if (isCameraActive) {
        requestAnimationFrame(detectFaceInVideo)
      }
    } catch (err) {
      console.error('Face detection error:', err)
      setError('Face detection failed. Please reload the page and try again.')
      
      // Retry detection after a delay
      setTimeout(() => {
        if (isCameraActive) {
          detectFaceInVideo()
        }
      }, 3000)
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
  
  // Cleanup on unmount
  useEffect(() => {
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
          <Button onClick={startCamera}>Start Camera</Button>
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
      {isApiAvailable && (
        <p className="text-xs text-green-600">API backend available for improved face detection</p>
      )}
    </div>
  )
} 