"use client"

import React, { useRef, useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Camera, X } from "lucide-react"

interface WebcamCaptureProps {
  onCapture: (imageData: string | File) => void
  onCancel?: () => void
  captureButtonText?: string
  width?: number
  height?: number
  returnAsFile?: boolean
  fileName?: string
}

export default function WebcamCapture({
  onCapture,
  onCancel,
  captureButtonText = "Capture Photo",
  width = 640,
  height = 480,
  returnAsFile = false,
  fileName = "capture.jpg"
}: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isVideoActive, setIsVideoActive] = useState(false)
  const [isCaptured, setIsCaptured] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startVideo = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: width },
          height: { ideal: height },
          facingMode: "user",
        },
        audio: false,
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsVideoActive(true)
        setError(null)
      }
    } catch (err) {
      console.error("Error accessing webcam:", err)
      setError("Could not access webcam. Please ensure you have given permission and have a working camera.")
    }
  }, [width, height])

  const stopVideo = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((track) => track.stop())
      videoRef.current.srcObject = null
      setIsVideoActive(false)
    }
  }, [])

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current && isVideoActive) {
      const context = canvasRef.current.getContext("2d")
      
      if (context) {
        // Set canvas dimensions to match video
        canvasRef.current.width = videoRef.current.videoWidth
        canvasRef.current.height = videoRef.current.videoHeight
        
        // Draw current video frame to canvas
        context.drawImage(
          videoRef.current,
          0,
          0,
          videoRef.current.videoWidth,
          videoRef.current.videoHeight
        )
        
        // Get data URL from canvas
        const dataUrl = canvasRef.current.toDataURL("image/jpeg")
        
        // Return as File or string
        if (returnAsFile) {
          // Convert data URL to Blob
          const blob = dataURLtoBlob(dataUrl)
          const file = new File([blob], fileName, { type: "image/jpeg" })
          onCapture(file)
        } else {
          onCapture(dataUrl)
        }
        
        setIsCaptured(true)
        stopVideo()
      }
    }
  }, [isVideoActive, onCapture, returnAsFile, fileName, stopVideo])

  // Helper function to convert dataURL to Blob
  const dataURLtoBlob = (dataURL: string) => {
    const arr = dataURL.split(",")
    const mime = arr[0].match(/:(.*?);/)![1]
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    
    return new Blob([u8arr], { type: mime })
  }

  const retake = useCallback(() => {
    setIsCaptured(false)
    startVideo()
  }, [startVideo])

  const handleCancel = useCallback(() => {
    stopVideo()
    if (onCancel) onCancel()
  }, [stopVideo, onCancel])

  useEffect(() => {
    startVideo()
    
    return () => {
      stopVideo()
    }
  }, [startVideo, stopVideo])

  return (
    <div className="flex flex-col items-center">
      <div className="relative bg-black rounded-lg overflow-hidden w-full max-w-[640px] aspect-video">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center text-center p-4 bg-red-50">
            <p className="text-red-600">{error}</p>
          </div>
        ) : isCaptured ? (
          <canvas ref={canvasRef} className="w-full h-full object-cover" />
        ) : (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted
          />
        )}
        
        {isVideoActive && (
          <div className="absolute top-2 right-2">
            <Button 
              variant="destructive" 
              size="icon" 
              className="h-8 w-8 rounded-full"
              onClick={handleCancel}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      
      <div className="mt-4 flex gap-3">
        {isCaptured ? (
          <Button onClick={retake} variant="outline">
            Retake Photo
          </Button>
        ) : (
          <Button 
            onClick={capturePhoto} 
            disabled={!isVideoActive}
            className="flex items-center gap-2"
          >
            <Camera className="h-4 w-4" />
            {captureButtonText}
          </Button>
        )}
      </div>
    </div>
  )
} 