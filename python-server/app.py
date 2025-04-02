import os
import cv2
import numpy as np
import datetime
import traceback
from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
from werkzeug.utils import secure_filename
import supabase_helper as sb
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Print Supabase URL to verify it's loaded correctly
print(f"Supabase URL: {os.environ.get('SUPABASE_URL')}")
print(f"Supabase key length: {len(os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')) if os.environ.get('SUPABASE_SERVICE_ROLE_KEY') else 0}")

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Constants and configurations
UPLOAD_FOLDER = 'uploads'
STUDENT_IMAGES_FOLDER = os.path.join(UPLOAD_FOLDER, 'students')
ATTENDANCE_FOLDER = os.path.join(UPLOAD_FOLDER, 'attendance')

# Create necessary directories
os.makedirs(STUDENT_IMAGES_FOLDER, exist_ok=True)
os.makedirs(ATTENDANCE_FOLDER, exist_ok=True)

# Face detection cascade classifier
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# Function to process base64 image and save
def process_base64_image(base64_string, save_path):
    # Remove header if present
    if ',' in base64_string:
        base64_string = base64_string.split(',')[1]
    
    # Decode and save image
    img_data = base64.b64decode(base64_string)
    with open(save_path, 'wb') as f:
        f.write(img_data)
    return save_path

# Function to detect and encode faces using OpenCV
def encode_faces(image_path, student_id, name):
    # Load image using OpenCV
    image = cv2.imread(image_path)
    if image is None:
        return False, "Could not load image"
    
    # Convert to grayscale for face detection
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Detect faces in the image
    faces = face_cascade.detectMultiScale(gray, 1.1, 5)
    
    if len(faces) == 0:
        return False, "No face detected in the image"
    
    # Get the largest face detected
    largest_face = max(faces, key=lambda rect: rect[2] * rect[3])
    x, y, w, h = largest_face
    
    # Extract face ROI
    face_roi = image[y:y+h, x:x+w]
    
    # Resize to a standard size for better comparison
    face_roi = cv2.resize(face_roi, (150, 150))
    
    # Convert to grayscale
    face_roi_gray = cv2.cvtColor(face_roi, cv2.COLOR_BGR2GRAY)
    
    # Flatten the array for storage
    face_encoding = face_roi_gray.flatten()
    
    return True, face_encoding

# Calculate face similarity using normalized cross-correlation
def face_similarity(face1, face2):
    face1 = face1.astype(np.float32)
    face2 = face2.astype(np.float32)
    
    # Reshape if flattened
    if len(face1.shape) == 1:
        size = int(np.sqrt(face1.shape[0] / 150) * 150)
        face1 = face1.reshape(size, size)
    if len(face2.shape) == 1:
        size = int(np.sqrt(face2.shape[0] / 150) * 150)
        face2 = face2.reshape(size, size)
    
    # Resize to ensure same dimensions
    face1 = cv2.resize(face1, (150, 150))
    face2 = cv2.resize(face2, (150, 150))
    
    # Normalize images
    face1 = (face1 - np.mean(face1)) / np.std(face1)
    face2 = (face2 - np.mean(face2)) / np.std(face2)
    
    # Calculate cross-correlation
    correlation = np.sum(face1 * face2) / (np.sqrt(np.sum(face1 * face1)) * np.sqrt(np.sum(face2 * face2)))
    
    return correlation

# Function to recognize faces in an image
def recognize_faces(image_path):
    # Load image
    image = cv2.imread(image_path)
    if image is None:
        return []
    
    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Detect faces in the image
    faces = face_cascade.detectMultiScale(gray, 1.1, 5)
    
    recognized_students = []
    
    # Get all students with face encodings from Supabase
    known_face_encodings = sb.get_all_face_encodings()
    
    for (x, y, w, h) in faces:
        # Extract face region
        face_roi = image[y:y+h, x:x+w]
        face_roi = cv2.resize(face_roi, (150, 150))
        face_roi_gray = cv2.cvtColor(face_roi, cv2.COLOR_BGR2GRAY)
        face_encoding = face_roi_gray.flatten()
        
        best_match = None
        best_similarity = -1
        threshold = 0.5  # Minimum similarity threshold
        
        # Compare with each known face
        for i, known_encoding in enumerate(known_face_encodings['encodings']):
            similarity = face_similarity(face_encoding, known_encoding)
            
            if similarity > threshold and similarity > best_similarity:
                best_similarity = similarity
                best_match = i
        
        if best_match is not None:
            student_id = known_face_encodings['student_ids'][best_match]
            name = known_face_encodings['names'][best_match]
            
            recognized_students.append({
                'student_id': student_id,
                'name': name,
                'confidence': float(best_similarity),
                'status': 'present'
            })
    
    return recognized_students

# Routes
@app.route('/api/register', methods=['POST'])
def register():
    try:
        # Extract student details
        student_id = request.form.get('studentId')
        first_name = request.form.get('firstName')
        last_name = request.form.get('lastName')
        email = request.form.get('email')
        phone = request.form.get('phone')
        batch = request.form.get('batch')
        semester = request.form.get('semester')
        department = request.form.get('department')
        
        print(f"Registering student: {student_id}, {first_name} {last_name}")
        
        # Process face image
        if 'faceImage' not in request.files:
            return jsonify({'success': False, 'message': 'No face image provided'}), 400
        
        face_image = request.files['faceImage']
        if face_image.filename == '':
            return jsonify({'success': False, 'message': 'No selected file'}), 400
        
        # Save the face image locally first
        filename = secure_filename(f"{student_id}_{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}.jpg")
        image_path = os.path.join(STUDENT_IMAGES_FOLDER, filename)
        face_image.save(image_path)
        print(f"Saved image locally to: {image_path}")
        
        # Encode the face
        success, face_encoding_or_message = encode_faces(image_path, student_id, f"{first_name} {last_name}")
        
        if not success:
            return jsonify({'success': False, 'message': face_encoding_or_message}), 400
        
        # Upload the image to Supabase Storage
        try:
            print("Uploading image to Supabase Storage...")
            image_url = sb.upload_student_image(student_id, image_path)
            print(f"Image uploaded, URL: {image_url}")
        except Exception as e:
            print(f"Error uploading to storage: {str(e)}")
            traceback.print_exc()
            # Use local path as fallback
            image_url = f"/uploads/students/{filename}"
        
        # Create student object
        student_data = {
            'id': student_id,
            'first_name': first_name,
            'last_name': last_name,
            'email': email,
            'phone': phone,
            'batch': batch,
            'semester': semester,
            'department': department,
            'image_url': image_url  # Store the image URL in the database
        }
        
        # Save to Supabase
        try:
            print("Saving student to Supabase...")
            student = sb.create_student(student_data, face_encoding_or_message)
            print("Student saved successfully")
        except Exception as e:
            print(f"Error saving to database: {str(e)}")
            traceback.print_exc()
            return jsonify({'success': False, 'message': f"Database error: {str(e)}"}), 500
        
        return jsonify({
            'success': True,
            'message': 'Student registered successfully',
            'student': student
        })
        
    except Exception as e:
        print(f"Error in register endpoint: {str(e)}")
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/mark-attendance', methods=['POST'])
def mark_attendance():
    try:
        # Extract attendance details
        session_id = request.form.get('sessionId')
        
        # Check if session exists using direct function call
        session = sb.get_attendance_sessions()
        session_exists = any(s['id'] == session_id for s in session)
        
        if not session_exists:
            # Create new session if it doesn't exist
            session_data = {
                'id': session_id,
                'name': request.form.get('sessionName', 'Unnamed Session'),
                'course': request.form.get('course', 'Unknown Course'),
                'date': datetime.datetime.now().strftime('%Y-%m-%d'),
                'start_time': datetime.datetime.now().strftime('%H:%M:%S'),
                'location': request.form.get('location', 'Unknown Location')
            }
            sb.create_attendance_session(session_data)
        
        # Process attendance image
        if 'attendanceImage' not in request.files:
            return jsonify({'success': False, 'message': 'No attendance image provided'}), 400
        
        attendance_image = request.files['attendanceImage']
        if attendance_image.filename == '':
            return jsonify({'success': False, 'message': 'No selected file'}), 400
        
        # Save the attendance image locally first
        filename = secure_filename(f"{session_id}_{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}.jpg")
        image_path = os.path.join(ATTENDANCE_FOLDER, filename)
        attendance_image.save(image_path)
        
        # Upload the image to Supabase Storage
        image_url = sb.upload_attendance_image(session_id, image_path)
        
        # Recognize faces in the image
        recognized_students = recognize_faces(image_path)
        
        # Create attendance records
        attendance_records = []
        for student in recognized_students:
            record = {
                'session_id': session_id,
                'student_id': student['student_id'],
                'status': student['status'],
                'confidence': student['confidence'],
                'timestamp': datetime.datetime.now().isoformat(),
                'image_url': image_url  # Store the attendance image URL
            }
            attendance_records.append(record)
        
        # Save attendance records to Supabase
        if attendance_records:
            saved_records = sb.save_attendance_records(attendance_records)
        else:
            saved_records = []
        
        return jsonify({
            'success': True,
            'message': f'Marked attendance for {len(saved_records)} student(s)',
            'records': saved_records,
            'recognized': recognized_students,
            'image_url': image_url  # Return the image URL in the response
        })
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/students', methods=['GET'])
def get_students():
    try:
        students = sb.get_all_students()
        return jsonify({
            'success': True,
            'students': students
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/student/<student_id>', methods=['GET'])
def get_student(student_id):
    try:
        student = sb.get_student(student_id)
        if not student:
            return jsonify({'success': False, 'message': 'Student not found'}), 404
        
        return jsonify({
            'success': True,
            'student': student
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/sessions', methods=['GET'])
def get_sessions():
    try:
        sessions = sb.get_attendance_sessions()
        return jsonify({
            'success': True,
            'sessions': sessions
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/session/<session_id>/attendance', methods=['GET'])
def get_session_attendance(session_id):
    try:
        attendance = sb.get_session_attendance(session_id)
        return jsonify({
            'success': True,
            'attendance': attendance
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/student/<student_id>/attendance', methods=['GET'])
def get_student_attendance(student_id):
    try:
        attendance = sb.get_student_attendance(student_id)
        return jsonify({
            'success': True,
            'attendance': attendance
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# Add a test endpoint to check Supabase connection
@app.route('/api/test-connection', methods=['GET'])
def test_connection():
    try:
        # Test database connection
        try:
            students = sb.get_all_students()
            db_status = "Connected"
        except Exception as e:
            db_status = f"Error: {str(e)}"
        
        # Test storage
        try:
            # Try to list buckets
            buckets = sb.supabase.storage.list_buckets()
            storage_status = "Connected"
            bucket_list = [bucket['name'] for bucket in buckets]
        except Exception as e:
            storage_status = f"Error: {str(e)}"
            bucket_list = []
        
        return jsonify({
            'success': True,
            'database': db_status,
            'storage': storage_status,
            'buckets': bucket_list,
            'environment': {
                'supabase_url': os.environ.get('SUPABASE_URL', 'Not set'),
                'service_key_length': len(os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')),
                'flask_env': os.environ.get('FLASK_ENV', 'Not set')
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# Run the app
if __name__ == '__main__':
    app.run(debug=True, port=5000) 