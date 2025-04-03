import { supabase } from './supabase';

/**
 * API URL for the face recognition backend
 */
const FACE_API_URL = process.env.NEXT_PUBLIC_FACE_API_URL || 'https://bpit-face-api.onrender.com';

/**
 * Convert a canvas or image element to a base64 string
 */
export function convertToBase64(element: HTMLCanvasElement | HTMLImageElement): string {
  // If it's already a canvas, get its data URL
  if (element instanceof HTMLCanvasElement) {
    return element.toDataURL('image/jpeg', 0.9);
  }
  
  // If it's an image, draw it to a canvas first
  const canvas = document.createElement('canvas');
  canvas.width = element.width;
  canvas.height = element.height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Failed to create canvas context');
  }
  
  ctx.drawImage(element, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.9);
}

/**
 * Test connection to the face recognition API
 */
export async function testApiConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${FACE_API_URL}/test-connection`);
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    const data = await response.json();
    console.log('API connection test successful:', data);
    return true;
  } catch (error) {
    console.error('API connection test failed:', error);
    return false;
  }
}

/**
 * Detect faces in an image using the Python API
 * This function mimics the interface of the TensorFlow.js detectFaces function
 * but uses the Python backend instead
 */
export async function detectFacesWithApi(input: HTMLCanvasElement | HTMLImageElement | HTMLVideoElement) {
  try {
    // For video elements, capture a frame first
    let imageData: string;
    
    if (input instanceof HTMLVideoElement) {
      const canvas = document.createElement('canvas');
      canvas.width = input.videoWidth;
      canvas.height = input.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Failed to create canvas context');
      }
      
      ctx.drawImage(input, 0, 0);
      imageData = canvas.toDataURL('image/jpeg', 0.9);
    } else {
      imageData = convertToBase64(input);
    }
    
    // Call the API
    const response = await fetch(`${FACE_API_URL}/detect-faces`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: imageData })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Face detection failed');
    }
    
    // Transform the API response to match the TensorFlow.js format
    return data.faces.map((face: any) => ({
      topLeft: [face.box.left, face.box.top],
      bottomRight: [face.box.right, face.box.bottom],
      landmarks: [], // API may not provide landmarks
      probability: [0.99], // Placeholder - API may provide confidence
      // Keep the original data too
      apiData: face
    }));
    
  } catch (error) {
    console.error('Error detecting faces with API:', error);
    throw error;
  }
}

/**
 * Register a student face
 */
export async function registerStudentFace(studentData: any, faceImage: HTMLCanvasElement) {
  try {
    const imageData = convertToBase64(faceImage);
    
    // Call the API
    const response = await fetch(`${FACE_API_URL}/register-face`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        studentData,
        image: imageData
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Face registration failed');
    }
    
    return {
      success: true,
      message: data.message || 'Student registered successfully'
    };
    
  } catch (error) {
    console.error('Error registering student face:', error);
    throw error;
  }
}

/**
 * Take attendance using face recognition
 */
export async function takeAttendanceWithApi(sessionData: any, faceImage: HTMLCanvasElement) {
  try {
    const imageData = convertToBase64(faceImage);
    
    // Call the API
    const response = await fetch(`${FACE_API_URL}/recognize-faces`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionData,
        image: imageData
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Face recognition failed');
    }
    
    return {
      success: true,
      message: data.message || 'Attendance recorded successfully',
      recognized: data.recognized || [],
      session_id: data.session_id
    };
    
  } catch (error) {
    console.error('Error taking attendance:', error);
    throw error;
  }
} 