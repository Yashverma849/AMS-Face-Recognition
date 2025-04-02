"use client"

import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import { supabase } from './supabase';

// Load models
let blazeFaceModel: blazeface.BlazeFaceModel | null = null;
let faceLandmarksModel: any = null;

/**
 * Initialize the face detection models
 */
export async function initFaceDetection() {
  try {
    // Load models if not already loaded
    if (!blazeFaceModel) {
      await tf.ready();
      console.log('TensorFlow.js loaded');
      
      // Load BlazeFace model for face detection
      blazeFaceModel = await blazeface.load();
      console.log('BlazeFace model loaded');
      
      // Load face landmarks model
      faceLandmarksModel = await faceLandmarksDetection.load(
        faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
        { maxFaces: 1 }
      );
      console.log('Face landmarks model loaded');
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing face detection:', error);
    return false;
  }
}

/**
 * Detect faces in an image
 */
export async function detectFaces(image: HTMLImageElement | HTMLVideoElement) {
  if (!blazeFaceModel) {
    await initFaceDetection();
  }
  
  try {
    // Detect faces
    const predictions = await blazeFaceModel!.estimateFaces(image, false);
    return predictions;
  } catch (error) {
    console.error('Error detecting faces:', error);
    return [];
  }
}

/**
 * Extract face encoding (feature vector) from a face image
 */
export async function extractFaceEncoding(
  image: HTMLImageElement | HTMLVideoElement,
  faceBox?: { topLeft: [number, number], bottomRight: [number, number] }
) {
  try {
    if (!faceLandmarksModel) {
      await initFaceDetection();
    }
    
    // Get face landmarks
    const predictions = await faceLandmarksModel!.estimateFaces({
      input: image,
      returnTensors: false,
      flipHorizontal: false,
      predictIrises: false
    });
    
    if (predictions.length === 0) {
      throw new Error('No face detected');
    }
    
    // Extract the landmarks as a feature vector
    const landmarks = predictions[0].scaledMesh;
    
    // Convert landmarks to a normalized feature vector
    const featureVector = normalizeFeatureVector(landmarks);
    
    return featureVector;
  } catch (error) {
    console.error('Error extracting face encoding:', error);
    throw error;
  }
}

/**
 * Normalize the feature vector for consistent comparison
 */
function normalizeFeatureVector(landmarks: number[][]) {
  // Extract x,y coordinates from landmarks
  const points = landmarks.map(point => [point[0], point[1]]);
  
  // Calculate the center of the face
  const center = calculateCenter(points);
  
  // Center the points and normalize by the average distance from center
  const centered = points.map(point => [
    point[0] - center[0],
    point[1] - center[1]
  ]);
  
  // Calculate average distance from center
  const distances = centered.map(point => 
    Math.sqrt(point[0] * point[0] + point[1] * point[1])
  );
  const avgDistance = distances.reduce((sum, val) => sum + val, 0) / distances.length;
  
  // Normalize by average distance
  const normalized = centered.map(point => [
    point[0] / avgDistance,
    point[1] / avgDistance
  ]);
  
  // Flatten the array for storage
  return normalized.flat();
}

/**
 * Calculate the center point of a set of points
 */
function calculateCenter(points: number[][]) {
  const sumX = points.reduce((sum, point) => sum + point[0], 0);
  const sumY = points.reduce((sum, point) => sum + point[1], 0);
  return [sumX / points.length, sumY / points.length];
}

/**
 * Compare two face encodings using cosine similarity
 */
export function compareFaceEncodings(encoding1: number[], encoding2: number[]) {
  // Calculate cosine similarity
  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;
  
  for (let i = 0; i < encoding1.length; i++) {
    dotProduct += encoding1[i] * encoding2[i];
    magnitude1 += encoding1[i] * encoding1[i];
    magnitude2 += encoding2[i] * encoding2[i];
  }
  
  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);
  
  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }
  
  const similarity = dotProduct / (magnitude1 * magnitude2);
  
  return similarity;
}

/**
 * Register a student with face encoding
 */
export async function registerStudentWithFace(
  studentData: any,
  faceImage: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
) {
  try {
    await initFaceDetection();
    
    // Detect faces first
    const faces = await detectFaces(faceImage);
    
    if (faces.length === 0) {
      throw new Error('No face detected in the image');
    }
    
    // Extract face encoding
    const faceEncoding = await extractFaceEncoding(faceImage);
    
    // Convert to base64 for storage
    const encodingBase64 = btoa(faceEncoding.join(','));
    
    // First, upload the image to Supabase Storage
    let imageUrl = '';
    
    if (faceImage instanceof HTMLCanvasElement) {
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => 
        faceImage.toBlob(blob => resolve(blob!), 'image/jpeg', 0.9)
      );
      
      // Upload to Supabase Storage
      const fileName = `${studentData.id}_${Date.now()}.jpg`;
      const { data, error } = await supabase.storage
        .from('student-images')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: true
        });
      
      if (error) {
        throw error;
      }
      
      // Get public URL
      imageUrl = supabase.storage
        .from('student-images')
        .getPublicUrl(fileName).data.publicUrl;
    }
    
    // Now create the student record with face encoding
    const student = {
      ...studentData,
      face_encoding: encodingBase64,
      image_url: imageUrl
    };
    
    const { data, error } = await supabase
      .from('students')
      .insert([student])
      .select();
    
    if (error) {
      throw error;
    }
    
    return data[0];
  } catch (error) {
    console.error('Error registering student with face:', error);
    throw error;
  }
}

/**
 * Recognize faces in an image and return matching students
 */
export async function recognizeFaces(image: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement) {
  try {
    await initFaceDetection();
    
    // Detect faces in the image
    const faces = await detectFaces(image);
    
    if (faces.length === 0) {
      return [];
    }
    
    // For each detected face, extract encoding and find matches
    const recognitionPromises = faces.map(async (face) => {
      try {
        // Extract encoding for this face
        const faceEncoding = await extractFaceEncoding(image);
        
        // Get all students from Supabase
        const { data: students, error } = await supabase
          .from('students')
          .select('id, first_name, last_name, face_encoding')
          .not('face_encoding', 'is', null);
        
        if (error) {
          throw error;
        }
        
        // Compare with each student's face encoding
        const matches = students
          .map(student => {
            // Convert stored base64 back to array
            const storedEncoding = student.face_encoding
              .split(',')
              .map((val: string) => parseFloat(val));
            
            // Compare encodings
            const similarity = compareFaceEncodings(faceEncoding, storedEncoding);
            
            return {
              student_id: student.id,
              name: `${student.first_name} ${student.last_name}`,
              confidence: similarity,
              status: similarity > 0.7 ? 'present' : 'unknown'
            };
          })
          .filter(match => match.status === 'present')
          .sort((a, b) => b.confidence - a.confidence);
        
        // Return the best match if any
        return matches.length > 0 ? matches[0] : null;
      } catch (error) {
        console.error('Error processing face:', error);
        return null;
      }
    });
    
    // Wait for all recognitions to complete
    const results = await Promise.all(recognitionPromises);
    
    // Filter out nulls and return results
    return results.filter(result => result !== null);
  } catch (error) {
    console.error('Error recognizing faces:', error);
    return [];
  }
}

/**
 * Take attendance by recognizing faces in an image
 * @param sessionData Object with session details
 * @param attendanceImage Canvas element with the captured image
 * @returns Object with recognition results
 */
export async function takeAttendance(sessionData: { id: string; name: string; timestamp: string }, attendanceImage: HTMLCanvasElement) {
  try {
    console.log('Taking attendance for session:', sessionData.name);
    const supabase = createClient();
    
    // Detect faces in the image
    const { model, blazeFaceModel } = await initFaceDetection();
    const faces = await detectFaces(attendanceImage);
    
    if (!faces || faces.length === 0) {
      console.log('No faces detected in the image');
      return {
        success: false,
        message: 'No faces detected in the image',
        records: []
      };
    }
    
    console.log(`Detected ${faces.length} faces in the image`);
    
    // Get registered students from database
    const { data: students, error: fetchError } = await supabase
      .from('students')
      .select('*');
      
    if (fetchError) {
      console.error('Error fetching students:', fetchError);
      throw new Error('Failed to fetch student data');
    }
    
    if (!students || students.length === 0) {
      return {
        success: false,
        message: 'No registered students found in the database',
        records: []
      };
    }
    
    // Process each detected face
    const recognitionPromises = faces.map(async (face) => {
      // Extract face encoding
      const faceEncoding = await extractFaceEncoding(attendanceImage, face);
      
      if (!faceEncoding) {
        console.log('Could not extract encoding for a face');
        return null;
      }
      
      // Compare with registered students
      let bestMatch = null;
      let highestSimilarity = 0;
      
      for (const student of students) {
        try {
          // Get the student's face encoding from Supabase storage
          const { data: encodingData, error: encodingError } = await supabase
            .from('face_encodings')
            .select('encoding')
            .eq('student_id', student.id)
            .single();
            
          if (encodingError || !encodingData) {
            console.log(`No encoding found for student ${student.id}`);
            continue;
          }
          
          const studentEncoding = encodingData.encoding;
          const similarity = compareFaceEncodings(faceEncoding, studentEncoding);
          
          if (similarity > highestSimilarity && similarity > 0.6) { // Threshold for recognition
            highestSimilarity = similarity;
            bestMatch = {
              student,
              similarity
            };
          }
        } catch (err) {
          console.error(`Error processing student ${student.id}:`, err);
        }
      }
      
      return bestMatch;
    });
    
    const recognitionResults = await Promise.all(recognitionPromises);
    const validMatches = recognitionResults.filter(match => match !== null);
    
    // Save attendance records to Supabase
    const attendanceRecords = validMatches.map(match => ({
      session_id: sessionData.id,
      session_name: sessionData.name,
      student_id: match.student.id,
      timestamp: sessionData.timestamp,
      confidence: match.similarity * 100
    }));
    
    if (attendanceRecords.length > 0) {
      const { error: insertError } = await supabase
        .from('attendance')
        .insert(attendanceRecords);
        
      if (insertError) {
        console.error('Error saving attendance records:', insertError);
        throw new Error('Failed to save attendance records');
      }
    }
    
    // Upload the attendance image to Supabase Storage
    const imageBlob = await new Promise<Blob>((resolve) => {
      attendanceImage.toBlob(resolve, 'image/jpeg');
    });
    
    const imagePath = `attendance/${sessionData.id}/${Date.now()}.jpg`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('attendance-images')
      .upload(imagePath, imageBlob);
      
    if (uploadError) {
      console.error('Error uploading attendance image:', uploadError);
    }
    
    // Get public URL for the uploaded image
    const { data: { publicUrl } } = supabase.storage
      .from('attendance-images')
      .getPublicUrl(imagePath);
      
    // Return recognition results with recognized students
    const recognizedStudents = validMatches.map(match => ({
      id: match.student.id,
      name: `${match.student.first_name} ${match.student.last_name}`,
      confidence: match.similarity * 100
    }));
    
    return {
      success: true,
      message: `Successfully recognized ${recognizedStudents.length} students`,
      records: attendanceRecords,
      recognized: validMatches.length,
      image_url: publicUrl,
      recognizedStudents: recognizedStudents
    };
  } catch (err) {
    console.error('Error taking attendance:', err);
    throw err;
  }
} 