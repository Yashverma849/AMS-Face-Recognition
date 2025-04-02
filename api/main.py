import base64
import io
import json
import os
import time
from datetime import datetime
from typing import Dict, List, Optional, Union

import cv2
import face_recognition
import numpy as np
from fastapi import BackgroundTasks, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from PIL import Image

# Initialize the FastAPI app
app = FastAPI(title="Face Recognition API")

# Add CORS middleware to allow frontend to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data directories
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
FACES_DIR = os.path.join(DATA_DIR, "faces")
ATTENDANCE_DIR = os.path.join(DATA_DIR, "attendance")

# Ensure directories exist
os.makedirs(FACES_DIR, exist_ok=True)
os.makedirs(ATTENDANCE_DIR, exist_ok=True)

# In-memory cache for known face encodings
known_face_encodings = []
known_face_names = []
last_encodings_load_time = 0
ENCODINGS_CACHE_TTL = 300  # 5 minutes


# Models for API request/response
class FaceDetectionRequest(BaseModel):
    image: str  # Base64 encoded image

class FaceDetectionResponse(BaseModel):
    success: bool
    faces: List[Dict[str, Union[str, float, List[float]]]]
    message: Optional[str] = None

class StudentData(BaseModel):
    id: str
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    batch: Optional[str] = None
    semester: Optional[str] = None
    department: Optional[str] = None

class RegisterStudentRequest(BaseModel):
    studentData: StudentData
    image: str  # Base64 encoded image

class AttendanceSessionRequest(BaseModel):
    sessionData: Dict[str, str]
    image: str  # Base64 encoded image


def load_known_faces():
    """Load all known face encodings from disk."""
    global known_face_encodings, known_face_names, last_encodings_load_time
    
    # Only reload if cache is expired
    current_time = time.time()
    if current_time - last_encodings_load_time < ENCODINGS_CACHE_TTL and known_face_encodings:
        return
    
    print("Loading known face encodings...")
    known_face_encodings = []
    known_face_names = []
    
    # Load student data and face encodings
    for student_id in os.listdir(FACES_DIR):
        student_dir = os.path.join(FACES_DIR, student_id)
        if not os.path.isdir(student_dir):
            continue
        
        # Load student metadata
        metadata_path = os.path.join(student_dir, "metadata.json")
        if not os.path.exists(metadata_path):
            continue
            
        try:
            with open(metadata_path, "r") as f:
                student_data = json.load(f)
            
            # Load face encoding
            encoding_path = os.path.join(student_dir, "encoding.npy")
            if not os.path.exists(encoding_path):
                continue
                
            face_encoding = np.load(encoding_path)
            
            # Add to known faces
            known_face_encodings.append(face_encoding)
            known_face_names.append({
                "id": student_id,
                "name": f"{student_data.get('first_name', '')} {student_data.get('last_name', '')}",
                "metadata": student_data
            })
            
        except Exception as e:
            print(f"Error loading face data for {student_id}: {e}")
    
    last_encodings_load_time = current_time
    print(f"Loaded {len(known_face_encodings)} face encodings")


def decode_base64_image(base64_image: str):
    """Decode a base64 image to a numpy array."""
    if "," in base64_image:
        base64_image = base64_image.split(",")[1]
    
    image_bytes = base64.b64decode(base64_image)
    image = Image.open(io.BytesIO(image_bytes))
    
    # Convert PIL Image to OpenCV format (RGB to BGR)
    cv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
    return cv_image


@app.get("/")
async def root():
    """Root endpoint to check if API is running."""
    return {"message": "Face Recognition API is running"}


@app.post("/api/detect-faces", response_model=FaceDetectionResponse)
async def detect_faces(request: FaceDetectionRequest):
    """Detect faces in an image."""
    try:
        # Decode base64 image
        image = decode_base64_image(request.image)
        
        # Convert to RGB for face_recognition library
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Detect faces (locations and encodings)
        face_locations = face_recognition.face_locations(rgb_image)
        face_encodings = face_recognition.face_encodings(rgb_image, face_locations)
        
        # Format response
        faces = []
        for i, (face_location, face_encoding) in enumerate(zip(face_locations, face_encodings)):
            top, right, bottom, left = face_location
            face_data = {
                "id": f"face_{i+1}",
                "box": {
                    "top": top,
                    "right": right,
                    "bottom": bottom,
                    "left": left
                },
                "encoding": face_encoding.tolist()
            }
            faces.append(face_data)
        
        return {
            "success": True,
            "faces": faces,
            "message": f"Detected {len(faces)} faces"
        }
        
    except Exception as e:
        print(f"Error in face detection: {e}")
        return {
            "success": False,
            "faces": [],
            "message": f"Error detecting faces: {str(e)}"
        }


@app.post("/api/register-student")
async def register_student(request: RegisterStudentRequest, background_tasks: BackgroundTasks):
    """Register a new student with face data."""
    try:
        # Decode base64 image
        image = decode_base64_image(request.image)
        
        # Detect face in the image
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        face_locations = face_recognition.face_locations(rgb_image)
        
        if not face_locations:
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": "No face detected in the image"}
            )
        
        if len(face_locations) > 1:
            return JSONResponse(
                status_code=400, 
                content={"success": False, "message": "Multiple faces detected. Please use an image with only one face"}
            )
        
        # Get face encoding
        face_encoding = face_recognition.face_encodings(rgb_image, face_locations)[0]
        
        # Create directory for student data
        student_id = request.studentData.id
        student_dir = os.path.join(FACES_DIR, student_id)
        os.makedirs(student_dir, exist_ok=True)
        
        # Save metadata
        student_data = request.studentData.dict()
        with open(os.path.join(student_dir, "metadata.json"), "w") as f:
            json.dump(student_data, f)
        
        # Save face encoding
        np.save(os.path.join(student_dir, "encoding.npy"), face_encoding)
        
        # Save face image
        cv2.imwrite(os.path.join(student_dir, "face.jpg"), image)
        
        # Refresh known faces cache in background
        background_tasks.add_task(load_known_faces)
        
        return {
            "success": True,
            "message": f"Student {student_id} registered successfully"
        }
        
    except Exception as e:
        print(f"Error registering student: {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": f"Error registering student: {str(e)}"}
        )


@app.post("/api/take-attendance")
async def take_attendance(request: AttendanceSessionRequest):
    """Take attendance by recognizing faces in an image."""
    try:
        # Load known faces if needed
        load_known_faces()
        
        if not known_face_encodings:
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": "No registered students found"}
            )
        
        # Decode base64 image
        image = decode_base64_image(request.image)
        
        # Convert to RGB for face_recognition library
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Detect faces
        face_locations = face_recognition.face_locations(rgb_image)
        face_encodings = face_recognition.face_encodings(rgb_image, face_locations)
        
        if not face_locations:
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": "No faces detected in the image"}
            )
        
        # Session info
        session_data = request.sessionData
        session_id = session_data.get("id", datetime.now().strftime("%Y%m%d_%H%M%S"))
        session_name = session_data.get("name", "Unnamed Session")
        timestamp = datetime.now().isoformat()
        
        # Recognize faces and take attendance
        recognized_students = []
        
        for face_encoding in face_encodings:
            # Compare with known faces
            face_distances = face_recognition.face_distance(known_face_encodings, face_encoding)
            best_match_index = np.argmin(face_distances)
            
            # Check if match is good enough (lower distance = better match)
            if face_distances[best_match_index] < 0.6:  # Threshold for good match
                student = known_face_names[best_match_index]
                confidence = (1 - face_distances[best_match_index]) * 100
                
                recognized_students.append({
                    "id": student["id"],
                    "name": student["name"],
                    "confidence": confidence
                })
        
        # Save attendance record if any students were recognized
        if recognized_students:
            attendance_record = {
                "session_id": session_id,
                "session_name": session_name,
                "timestamp": timestamp,
                "recognized_students": recognized_students
            }
            
            # Create attendance record directory
            os.makedirs(ATTENDANCE_DIR, exist_ok=True)
            
            # Save attendance record
            attendance_file = os.path.join(ATTENDANCE_DIR, f"{session_id}.json")
            with open(attendance_file, "w") as f:
                json.dump(attendance_record, f)
        
        return {
            "success": True,
            "recognizedStudents": recognized_students,
            "message": f"Recognized {len(recognized_students)} students"
        }
        
    except Exception as e:
        print(f"Error taking attendance: {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": f"Error taking attendance: {str(e)}"}
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 