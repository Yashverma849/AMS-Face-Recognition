import os
import json
import base64
import numpy as np
from supabase import create_client, Client
import io
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

print(f"DEBUG - Supabase URL is set: {'Yes' if supabase_url else 'No'}")
print(f"DEBUG - Supabase key is set: {'Yes' if supabase_key else 'No'}")

# Check if the environment variables are loaded
if not supabase_url or not supabase_key:
    raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables")

# Now create the client
supabase: Client = create_client(supabase_url, supabase_key)

# Helper functions for Supabase operations

def encode_face_encoding(face_encoding):
    """Convert numpy array to base64 string for storage in Supabase"""
    return base64.b64encode(face_encoding.tobytes()).decode('utf-8')

def decode_face_encoding(encoded_string):
    """Convert base64 string back to numpy array"""
    decoded = base64.b64decode(encoded_string)
    return np.frombuffer(decoded, dtype=np.float64)

# Storage functions for images
def upload_student_image(student_id, image_path):
    """Upload student image to Supabase Storage
    
    Args:
        student_id: The ID of the student
        image_path: Local path to the image file
        
    Returns:
        The public URL of the uploaded image
    """
    bucket_name = "student-images"
    
    # Create the bucket if it doesn't exist (will ignore if it exists)
    try:
        supabase.storage.create_bucket(bucket_name, {'public': True})
    except Exception as e:
        print(f"Bucket already exists or error creating bucket: {str(e)}")
        # Continue anyway, the bucket might already exist
    
    # Read the image file
    with open(image_path, "rb") as f:
        file_content = f.read()
    
    # Get file extension
    _, file_extension = os.path.splitext(image_path)
    
    # Upload the image with student ID as filename
    file_name = f"{student_id}{file_extension}"
    try:
        res = supabase.storage.from_(bucket_name).upload(
            file_name,
            file_content,
            {"content-type": "image/jpeg", "upsert": True}
        )
    except Exception as e:
        print(f"Error uploading file: {str(e)}")
        # Return local path as fallback
        return f"/uploads/students/{os.path.basename(image_path)}"
    
    # Get public URL
    public_url = supabase.storage.from_(bucket_name).get_public_url(file_name)
    
    return public_url

def upload_attendance_image(session_id, image_path):
    """Upload attendance image to Supabase Storage
    
    Args:
        session_id: The ID of the attendance session
        image_path: Local path to the image file
        
    Returns:
        The public URL of the uploaded image
    """
    bucket_name = "attendance-images"
    
    # Create the bucket if it doesn't exist (will ignore if it exists)
    try:
        supabase.storage.create_bucket(bucket_name, {'public': True})
    except Exception as e:
        print(f"Bucket already exists or error creating bucket: {str(e)}")
        # Continue anyway, the bucket might already exist
    
    # Read the image file
    with open(image_path, "rb") as f:
        file_content = f.read()
    
    # Generate unique filename with timestamp
    timestamp = os.path.basename(image_path).split('_')[-1]
    file_name = f"{session_id}_{timestamp}"
    
    # Upload the image
    try:
        res = supabase.storage.from_(bucket_name).upload(
            file_name,
            file_content,
            {"content-type": "image/jpeg", "upsert": True}
        )
    except Exception as e:
        print(f"Error uploading file: {str(e)}")
        # Return local path as fallback
        return f"/uploads/attendance/{os.path.basename(image_path)}"
    
    # Get public URL
    public_url = supabase.storage.from_(bucket_name).get_public_url(file_name)
    
    return public_url

# Student operations
def get_all_students():
    """Get all students from Supabase"""
    response = supabase.table('students').select('*').execute()
    return response.data

def get_student(student_id):
    """Get a student by ID"""
    response = supabase.table('students').select('*').eq('id', student_id).execute()
    if response.data:
        return response.data[0]
    return None

def create_student(student_data, face_encoding=None):
    """Create a new student with face encoding"""
    # If face encoding is provided, convert to string
    if face_encoding is not None:
        student_data['face_encoding'] = encode_face_encoding(face_encoding)
    
    response = supabase.table('students').insert(student_data).execute()
    return response.data[0] if response.data else None

def update_student(student_id, student_data):
    """Update student data"""
    response = supabase.table('students').update(student_data).eq('id', student_id).execute()
    return response.data[0] if response.data else None

def get_all_face_encodings():
    """Get all students with their face encodings"""
    response = supabase.table('students').select('id, first_name, last_name, face_encoding').execute()
    
    result = {
        'encodings': [],
        'names': [],
        'student_ids': []
    }
    
    for student in response.data:
        if student.get('face_encoding'):
            result['encodings'].append(decode_face_encoding(student['face_encoding']))
            result['names'].append(f"{student['first_name']} {student['last_name']}")
            result['student_ids'].append(student['id'])
    
    return result

# Attendance operations
def create_attendance_session(session_data):
    """Create a new attendance session"""
    response = supabase.table('attendance_sessions').insert(session_data).execute()
    return response.data[0] if response.data else None

def get_attendance_sessions():
    """Get all attendance sessions"""
    response = supabase.table('attendance_sessions').select('*').order('date', desc=True).execute()
    return response.data

def save_attendance_records(records):
    """Save multiple attendance records"""
    if not records:
        return []
    
    response = supabase.table('attendance_records').insert(records).execute()
    return response.data

def get_session_attendance(session_id):
    """Get attendance records for a session with student details"""
    response = supabase.table('attendance_records').select('''
        *,
        students(id, first_name, last_name)
    ''').eq('session_id', session_id).execute()
    
    return response.data

def get_student_attendance(student_id):
    """Get attendance records for a student"""
    response = supabase.table('attendance_records').select('''
        *,
        attendance_sessions(id, name, course, date)
    ''').eq('student_id', student_id).execute()
    
    return response.data 