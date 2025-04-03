import base64
import io
import json
import os
import time
from datetime import datetime
from typing import Dict, List, Optional, Union

import cv2
# import face_recognition
import face_recognition as custom_fr  # Use our custom module
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
DATA_DIR = os.path.join("/app", "data")
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


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "face_recognition_loaded": custom_fr is not None,
        "known_faces_count": len(known_face_encodings)
    }


@app.post("/api/detect-faces", response_model=FaceDetectionResponse)
async def detect_faces_legacy(request: FaceDetectionRequest):
    """Legacy endpoint for detecting faces in an image."""
    return await detect_faces(request)


@app.post("/detect-faces", response_model=FaceDetectionResponse)
async def detect_faces(request: FaceDetectionRequest):
    """Detect faces in an image."""
    try:
        # Decode base64 image
        image = decode_base64_image(request.image)
        
        # Convert to RGB for face_recognition library
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Detect faces (locations and encodings)
        face_locations = custom_fr.face_locations(rgb_image)
        face_encodings = custom_fr.face_encodings(rgb_image, face_locations)
        
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
async def register_student_legacy(request: RegisterStudentRequest, background_tasks: BackgroundTasks):
    """Legacy endpoint for registering a student with face data."""
    return await register_student(request, background_tasks)


@app.post("/register-face")
async def register_student(request: RegisterStudentRequest = None, background_tasks: BackgroundTasks = None,
                          image: UploadFile = File(...), student_id: str = Form(...), name: str = Form(...)):
    """Register a new student with face data."""
    try:
        # If using JSON request
        if request:
            # Decode base64 image
            image_data = decode_base64_image(request.image)
            student_id = request.studentData.id
            student_name = f"{request.studentData.first_name} {request.studentData.last_name}"
            student_data = request.studentData.dict()
        else:
            # For multipart form data
            contents = await image.read()
            nparr = np.frombuffer(contents, np.uint8)
            image_data = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            student_name = name
            student_data = {
                "id": student_id,
                "name": name,
                "registration_date": datetime.now().isoformat()
            }
        
        # Detect face in the image
        rgb_image = cv2.cvtColor(image_data, cv2.COLOR_BGR2RGB)
        face_locations = custom_fr.face_locations(rgb_image)
        
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
        face_encoding = custom_fr.face_encodings(rgb_image, face_locations)[0]
        
        # Create directory for student data
        student_dir = os.path.join(FACES_DIR, student_id)
        os.makedirs(student_dir, exist_ok=True)
        
        # Save metadata
        with open(os.path.join(student_dir, "metadata.json"), "w") as f:
            json.dump(student_data, f)
        
        # Save face encoding
        np.save(os.path.join(student_dir, "encoding.npy"), face_encoding)
        
        # Save face image
        cv2.imwrite(os.path.join(student_dir, "face.jpg"), image_data)
        
        # Refresh known faces cache in background
        if background_tasks:
            background_tasks.add_task(load_known_faces)
        else:
            # If no background tasks available, reload directly
            load_known_faces()
        
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
async def take_attendance_legacy(request: AttendanceSessionRequest):
    """Legacy endpoint for taking attendance."""
    return await take_attendance(request)


@app.post("/recognize-faces")
async def take_attendance(request: AttendanceSessionRequest = None, 
                         image: UploadFile = File(None)):
    """Take attendance by recognizing faces in an image."""
    try:
        # Load known faces if needed
        load_known_faces()
        
        if len(known_face_encodings) == 0:
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": "No registered faces found. Please register students first."}
            )
        
        # Get image based on request type
        if request and request.image:
            # JSON request with base64 image
            image_data = decode_base64_image(request.image)
            session_data = request.sessionData
        elif image:
            # Multipart form data
            contents = await image.read()
            nparr = np.frombuffer(contents, np.uint8)
            image_data = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            session_data = {"type": "default", "timestamp": datetime.now().isoformat()}
        else:
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": "No image provided"}
            )
            
        # Detect faces
        rgb_image = cv2.cvtColor(image_data, cv2.COLOR_BGR2RGB)
        face_locations = custom_fr.face_locations(rgb_image)
        
        if not face_locations:
            return {
                "success": False,
                "message": "No faces detected in the image",
                "recognized": []
            }
        
        # Get face encodings
        face_encodings = custom_fr.face_encodings(rgb_image, face_locations)
        
        # Compare with known faces
        recognized_students = []
        
        for i, (face_location, face_encoding) in enumerate(zip(face_locations, face_encodings)):
            # Compare face with all known faces
            matches = custom_fr.compare_faces(known_face_encodings, face_encoding, tolerance=0.6)
            face_distances = custom_fr.face_distance(known_face_encodings, face_encoding)
            
            best_match_index = np.argmin(face_distances)
            
            if matches[best_match_index]:
                student = known_face_names[best_match_index].copy()
                student["confidence"] = float(1 - face_distances[best_match_index])
                student["face_location"] = face_location
                recognized_students.append(student)
            else:
                # Unknown face
                top, right, bottom, left = face_location
                recognized_students.append({
                    "id": f"unknown_{i+1}",
                    "name": "Unknown",
                    "confidence": 0.0,
                    "face_location": face_location
                })
        
        # Record attendance if needed
        attendance_record = {
            "session": session_data,
            "timestamp": datetime.now().isoformat(),
            "recognized_students": [s["id"] for s in recognized_students if "unknown_" not in s["id"]],
            "unknown_count": sum(1 for s in recognized_students if "unknown_" in s["id"])
        }
        
        # Save attendance record
        session_id = session_data.get("id", datetime.now().strftime("%Y%m%d_%H%M%S"))
        attendance_path = os.path.join(ATTENDANCE_DIR, f"{session_id}.json")
        with open(attendance_path, "w") as f:
            json.dump(attendance_record, f)
        
        return {
            "success": True,
            "message": f"Recognized {len([s for s in recognized_students if 'unknown_' not in s['id']])} students",
            "recognized": recognized_students,
            "session_id": session_id
        }
        
    except Exception as e:
        print(f"Error in face recognition: {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": f"Error in face recognition: {str(e)}", "recognized": []}
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 